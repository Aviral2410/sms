package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class ConversationMemoryService {
    private static final int MAX_MESSAGES_PER_CHAT = 200;
    private static final int MAX_CONTEXT_MESSAGES = 20;

    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    private final Map<UUID, WorkspaceRecord> workspacesFallback = new ConcurrentHashMap<>();
    private final Map<UUID, ChatRecord> chatsFallback = new ConcurrentHashMap<>();
    private final Map<UUID, List<ChatMessageRecord>> messagesFallback = new ConcurrentHashMap<>();

    public ConversationMemoryService(ObjectMapper objectMapper, ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    private UUID getEffectiveUserId(UserContext user) {
        if (user.guestId() != null && (user.userId() == null || user.userId().equals(new UUID(0L, 0L)))) {
            // Derive a stable UUID from the guestId for anonymous storage
            return UUID.nameUUIDFromBytes(user.guestId().getBytes());
        }
        return user.userId() != null ? user.userId() : new UUID(0L, 0L);
    }

    public WorkspaceRecord createWorkspace(UserContext user, String name) {
        Instant now = Instant.now();
        WorkspaceRecord workspace = new WorkspaceRecord(
                UUID.randomUUID(),
                getEffectiveUserId(user),
                user.tenantId(),
                user.schoolId(),
                sanitizeName(name, "My Workspace"),
                now,
                now
        );

        if (!saveWorkspaceRedis(workspace)) {
            workspacesFallback.put(workspace.workspaceId(), workspace);
        }
        return workspace;
    }

    public List<WorkspaceRecord> listWorkspaces(UserContext user) {
        UUID effectiveUserId = getEffectiveUserId(user);
        List<WorkspaceRecord> fromRedis = loadUserWorkspacesRedis(effectiveUserId);
        if (!fromRedis.isEmpty()) {
            return fromRedis;
        }
        return workspacesFallback.values().stream()
                .filter(ws -> ws.userId().equals(effectiveUserId))
                .sorted(Comparator.comparing(WorkspaceRecord::updatedAt).reversed())
                .toList();
    }

    public WorkspaceRecord ensureDefaultWorkspace(UserContext user) {
        List<WorkspaceRecord> existing = listWorkspaces(user);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        return createWorkspace(user, "Default Workspace");
    }

    public ChatRecord createChat(UserContext user, UUID workspaceId, String title) {
        WorkspaceRecord workspace = requireWorkspaceOwnedByUser(user, workspaceId);
        Instant now = Instant.now();
        ChatRecord chat = new ChatRecord(
                UUID.randomUUID(),
                workspace.workspaceId(),
                getEffectiveUserId(user),
                sanitizeName(title, "New Chat"),
                now,
                now
        );
        if (!saveChatRedis(chat)) {
            chatsFallback.put(chat.conversationId(), chat);
        }
        return chat;
    }

    public ChatRecord ensureChat(UserContext user, UUID conversationId, UUID requestedWorkspaceId, String suggestedTitle) {
        ChatRecord existing = findChatOwnedByUser(user, conversationId);
        if (existing != null) {
            return existing;
        }
        UUID workspaceId = requestedWorkspaceId != null
                ? requestedWorkspaceId
                : ensureDefaultWorkspace(user).workspaceId();
        return createChat(user, workspaceId, suggestedTitle);
    }

    public List<ChatRecord> listChats(UserContext user, UUID workspaceId) {
        UUID effectiveWorkspaceId = workspaceId;
        if (effectiveWorkspaceId == null) {
            effectiveWorkspaceId = ensureDefaultWorkspace(user).workspaceId();
        }
        
        WorkspaceRecord workspace = requireWorkspaceOwnedByUser(user, effectiveWorkspaceId);
        UUID effectiveUserId = getEffectiveUserId(user);
        List<ChatRecord> fromRedis = loadWorkspaceChatsRedis(workspace.workspaceId(), effectiveUserId);
        if (!fromRedis.isEmpty()) {
            return fromRedis;
        }
        return chatsFallback.values().stream()
                .filter(chat -> chat.userId().equals(effectiveUserId) && chat.workspaceId().equals(workspace.workspaceId()))
                .sorted(Comparator.comparing(ChatRecord::updatedAt).reversed())
                .toList();
    }

    public void deleteChat(UserContext user, UUID conversationId) {
        ChatRecord chat = requireChatOwnedByUser(user, conversationId);
        if (redisTemplate != null) {
            redisTemplate.delete("ai:chat:" + chat.conversationId());
            redisTemplate.delete("ai:chat:" + chat.conversationId() + ":messages");
            redisTemplate.opsForSet().remove("ai:workspace:" + chat.workspaceId() + ":chats", chat.conversationId().toString());
        }
        chatsFallback.remove(chat.conversationId());
        messagesFallback.remove(chat.conversationId());
    }

    public void addUserMessage(UserContext user, UUID conversationId, String message) {
        appendMessage(user, conversationId, "user", message, null);
    }

    public void addAssistantResponse(UserContext user, UUID conversationId, String textSummary, ObjectNode structuredPayload) {
        appendMessage(user, conversationId, "assistant", textSummary, structuredPayload);
    }

    public void clearMessages(UserContext user, UUID conversationId) {
        ChatRecord chat = requireChatOwnedByUser(user, conversationId);
        if (!clearMessagesRedis(chat.conversationId())) {
            messagesFallback.remove(chat.conversationId());
        }
        touchChatUpdatedAt(chat);
    }

    public List<String> getRecentTextHistory(UserContext user, UUID conversationId) {
        List<ChatMessageRecord> rows = listMessages(user, conversationId, MAX_CONTEXT_MESSAGES);
        List<String> out = new ArrayList<>();
        for (ChatMessageRecord row : rows) {
            if (row.content() != null && !row.content().isBlank()) {
                out.add(row.role() + ": " + row.content());
            }
        }
        return out;
    }

    public List<ChatMessageRecord> listMessages(UserContext user, UUID conversationId, int limit) {
        ChatRecord chat = requireChatOwnedByUser(user, conversationId);
        int safeLimit = Math.max(1, Math.min(limit, 200));
        List<ChatMessageRecord> fromRedis = loadMessagesRedis(chat.conversationId(), safeLimit);
        if (!fromRedis.isEmpty()) {
            return fromRedis;
        }
        List<ChatMessageRecord> fallback = messagesFallback.getOrDefault(chat.conversationId(), List.of());
        int from = Math.max(0, fallback.size() - safeLimit);
        return List.copyOf(fallback.subList(from, fallback.size()));
    }

    private void appendMessage(UserContext user, UUID conversationId, String role, String content, ObjectNode payload) {
        ChatRecord chat = requireChatOwnedByUser(user, conversationId);
        ChatMessageRecord msg = new ChatMessageRecord(
                UUID.randomUUID(),
                chat.conversationId(),
                role,
                content == null ? "" : content.trim(),
                payload,
                Instant.now()
        );
        if (!saveMessageRedis(msg)) {
            messagesFallback.compute(chat.conversationId(), (id, current) -> {
                List<ChatMessageRecord> next = current == null ? new ArrayList<>() : new ArrayList<>(current);
                next.add(msg);
                if (next.size() > MAX_MESSAGES_PER_CHAT) {
                    next = new ArrayList<>(next.subList(next.size() - MAX_MESSAGES_PER_CHAT, next.size()));
                }
                return next;
            });
        }
        touchChatUpdatedAt(chat);
    }

    private WorkspaceRecord requireWorkspaceOwnedByUser(UserContext user, UUID workspaceId) {
        WorkspaceRecord workspace = findWorkspaceOwnedByUser(user, workspaceId);
        if (workspace == null) {
            throw new IllegalArgumentException("Workspace not found.");
        }
        return workspace;
    }

    private WorkspaceRecord findWorkspaceOwnedByUser(UserContext user, UUID workspaceId) {
        WorkspaceRecord redis = loadWorkspaceRedis(workspaceId);
        UUID effectiveUserId = getEffectiveUserId(user);
        if (redis != null && redis.userId().equals(effectiveUserId)) {
            return redis;
        }
        WorkspaceRecord fallback = workspacesFallback.get(workspaceId);
        if (fallback != null && fallback.userId().equals(effectiveUserId)) {
            return fallback;
        }
        return null;
    }

    private ChatRecord requireChatOwnedByUser(UserContext user, UUID conversationId) {
        ChatRecord chat = findChatOwnedByUser(user, conversationId);
        if (chat == null) {
            throw new IllegalArgumentException("Chat not found.");
        }
        return chat;
    }

    private ChatRecord findChatOwnedByUser(UserContext user, UUID conversationId) {
        ChatRecord redis = loadChatRedis(conversationId);
        UUID effectiveUserId = getEffectiveUserId(user);
        if (redis != null && redis.userId().equals(effectiveUserId)) {
            return redis;
        }
        ChatRecord fallback = chatsFallback.get(conversationId);
        if (fallback != null && fallback.userId().equals(effectiveUserId)) {
            return fallback;
        }
        return null;
    }

    private void touchChatUpdatedAt(ChatRecord chat) {
        ChatRecord next = new ChatRecord(
                chat.conversationId(),
                chat.workspaceId(),
                chat.userId(),
                chat.title(),
                chat.createdAt(),
                Instant.now()
        );
        if (!saveChatRedis(next)) {
            chatsFallback.put(next.conversationId(), next);
        }
    }

    private boolean saveWorkspaceRedis(WorkspaceRecord workspace) {
        try {
            if (redisTemplate == null) return false;
            String key = "ai:workspace:" + workspace.workspaceId();
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(workspace));
            redisTemplate.opsForSet().add("ai:user:" + workspace.userId() + ":workspaces", workspace.workspaceId().toString());
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private WorkspaceRecord loadWorkspaceRedis(UUID workspaceId) {
        try {
            if (redisTemplate == null) return null;
            String raw = redisTemplate.opsForValue().get("ai:workspace:" + workspaceId);
            if (raw == null || raw.isBlank()) return null;
            return objectMapper.readValue(raw, WorkspaceRecord.class);
        } catch (Exception ex) {
            return null;
        }
    }

    private List<WorkspaceRecord> loadUserWorkspacesRedis(UUID userId) {
        try {
            if (redisTemplate == null) return List.of();
            var ids = redisTemplate.opsForSet().members("ai:user:" + userId + ":workspaces");
            if (ids == null || ids.isEmpty()) return List.of();
            List<WorkspaceRecord> out = new ArrayList<>();
            for (String rawId : ids) {
                WorkspaceRecord ws = loadWorkspaceRedis(UUID.fromString(rawId));
                if (ws != null && ws.userId().equals(userId)) {
                    out.add(ws);
                }
            }
            out.sort(Comparator.comparing(WorkspaceRecord::updatedAt).reversed());
            return out;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private boolean saveChatRedis(ChatRecord chat) {
        try {
            if (redisTemplate == null) return false;
            String key = "ai:chat:" + chat.conversationId();
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(chat));
            redisTemplate.opsForSet().add("ai:workspace:" + chat.workspaceId() + ":chats", chat.conversationId().toString());
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private ChatRecord loadChatRedis(UUID conversationId) {
        try {
            if (redisTemplate == null) return null;
            String raw = redisTemplate.opsForValue().get("ai:chat:" + conversationId);
            if (raw == null || raw.isBlank()) return null;
            return objectMapper.readValue(raw, ChatRecord.class);
        } catch (Exception ex) {
            return null;
        }
    }

    private List<ChatRecord> loadWorkspaceChatsRedis(UUID workspaceId, UUID userId) {
        try {
            if (redisTemplate == null) return List.of();
            var ids = redisTemplate.opsForSet().members("ai:workspace:" + workspaceId + ":chats");
            if (ids == null || ids.isEmpty()) return List.of();
            List<ChatRecord> out = new ArrayList<>();
            for (String rawId : ids) {
                ChatRecord chat = loadChatRedis(UUID.fromString(rawId));
                if (chat != null && chat.userId().equals(userId) && chat.workspaceId().equals(workspaceId)) {
                    out.add(chat);
                }
            }
            out.sort(Comparator.comparing(ChatRecord::updatedAt).reversed());
            return out;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private boolean saveMessageRedis(ChatMessageRecord message) {
        try {
            if (redisTemplate == null) return false;
            String key = "ai:chat:" + message.conversationId() + ":messages";
            redisTemplate.opsForList().rightPush(key, objectMapper.writeValueAsString(message));
            Long size = redisTemplate.opsForList().size(key);
            if (size != null && size > MAX_MESSAGES_PER_CHAT) {
                redisTemplate.opsForList().trim(key, size - MAX_MESSAGES_PER_CHAT, -1);
            }
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private List<ChatMessageRecord> loadMessagesRedis(UUID conversationId, int limit) {
        try {
            if (redisTemplate == null) return List.of();
            String key = "ai:chat:" + conversationId + ":messages";
            Long size = redisTemplate.opsForList().size(key);
            if (size == null || size <= 0) return List.of();
            long start = Math.max(0, size - limit);
            var raw = redisTemplate.opsForList().range(key, start, -1);
            if (raw == null || raw.isEmpty()) return List.of();
            List<ChatMessageRecord> out = new ArrayList<>(raw.size());
            for (String row : raw) {
                out.add(objectMapper.readValue(row, ChatMessageRecord.class));
            }
            return out;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private boolean clearMessagesRedis(UUID conversationId) {
        try {
            if (redisTemplate == null) return false;
            String key = "ai:chat:" + conversationId + ":messages";
            redisTemplate.delete(key);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private String sanitizeName(String value, String fallback) {
        String safe = value == null ? "" : value.trim();
        if (safe.isBlank()) return fallback;
        if (safe.length() > 120) return safe.substring(0, 120);
        return safe;
    }

    public record WorkspaceRecord(
            UUID workspaceId,
            UUID userId,
            UUID tenantId,
            UUID schoolId,
            String name,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ChatRecord(
            UUID conversationId,
            UUID workspaceId,
            UUID userId,
            String title,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ChatMessageRecord(
            UUID messageId,
            UUID conversationId,
            String role,
            String content,
            ObjectNode payload,
            Instant timestamp
    ) {}
}
