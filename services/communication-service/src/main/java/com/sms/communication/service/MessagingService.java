package com.sms.communication.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.common.exception.NotFoundException;
import com.sms.communication.api.CommunicationDtos.MessageCreateRequest;
import com.sms.communication.api.CommunicationDtos.MessageResponse;
import com.sms.communication.api.CommunicationDtos.ThreadReadResponse;
import com.sms.communication.api.CommunicationDtos.ThreadCreateRequest;
import com.sms.communication.api.CommunicationDtos.ThreadResponse;
import com.sms.communication.domain.MessageEntity;
import com.sms.communication.domain.MessageThreadEntity;
import com.sms.communication.domain.MessageThreadParticipantEntity;
import com.sms.communication.repository.MessageRepository;
import com.sms.communication.repository.MessageThreadParticipantRepository;
import com.sms.communication.repository.MessageThreadRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessagingService {
    private static final Logger logger = LoggerFactory.getLogger(MessagingService.class);

    private final MessageThreadRepository threadRepository;
    private final MessageThreadParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    public MessagingService(
            MessageThreadRepository threadRepository,
            MessageThreadParticipantRepository participantRepository,
            MessageRepository messageRepository
    ) {
        this.threadRepository = threadRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional
    public ThreadResponse createThread(CommunicationActor actor, ThreadCreateRequest request) {
        requireActor(actor);
        if (request.participantUserIds() == null || request.participantUserIds().isEmpty()) {
            throw new IllegalArgumentException("participantUserIds is required.");
        }

        Set<UUID> participants = new LinkedHashSet<>();
        participants.add(actor.userId());
        participants.addAll(request.participantUserIds());

        if (participants.size() < 2) {
            throw new IllegalArgumentException("A thread must have at least 2 participants.");
        }
        if (participants.size() > 10) {
            throw new IllegalArgumentException("Too many participants for a single thread.");
        }
        if (isRestrictedRole(actor.roleName()) && participants.size() > 2) {
            throw new ForbiddenException("Students and parents can only create direct messages.");
        }

        Instant now = Instant.now();
        MessageThreadEntity thread = new MessageThreadEntity();
        thread.setThreadId(UUID.randomUUID());
        thread.setSchoolId(actor.schoolId());
        thread.setSubject(blankToNull(request.subject()));
        thread.setCreatedByUserId(actor.userId());
        thread.setCreatedAt(now);
        thread.setUpdatedAt(now);
        thread.setLastMessageAt(null);
        threadRepository.save(thread);

        for (UUID userId : participants) {
            MessageThreadParticipantEntity p = new MessageThreadParticipantEntity();
            p.setParticipantId(UUID.randomUUID());
            p.setSchoolId(actor.schoolId());
            p.setThreadId(thread.getThreadId());
            p.setUserId(userId);
            p.setRoleName(null);
            p.setJoinedAt(now);
            p.setLastReadAt(null);
            participantRepository.save(p);
        }

        logger.info("Message thread created. schoolId={} threadId={} createdByUserId={} participants={}",
                actor.schoolId(), thread.getThreadId(), actor.userId(), participants.size());

        return toThreadResponse(thread, new ArrayList<>(participants), 0L, now);
    }

    public List<ThreadResponse> listMyThreads(CommunicationActor actor) {
        requireActor(actor);
        List<MessageThreadEntity> threads = threadRepository.findThreadsForUser(actor.schoolId(), actor.userId());
        return threads.stream().map(t -> {
            List<MessageThreadParticipantEntity> participantRows = participantRepository
                    .findBySchoolIdAndThreadIdOrderByJoinedAtAsc(actor.schoolId(), t.getThreadId());
            List<UUID> participants = participantRows.stream()
                    .map(MessageThreadParticipantEntity::getUserId)
                    .toList();
            Instant lastReadAt = participantRows.stream()
                    .filter(p -> actor.userId().equals(p.getUserId()))
                    .map(MessageThreadParticipantEntity::getLastReadAt)
                    .findFirst()
                    .orElse(null);
            long unreadCount = countUnread(actor, t.getThreadId(), lastReadAt);
            return toThreadResponse(t, participants, unreadCount, lastReadAt);
        }).toList();
    }

    public List<MessageResponse> listMessages(CommunicationActor actor, UUID threadId) {
        requireActor(actor);
        MessageThreadParticipantEntity participant = requireParticipant(actor, threadId);

        List<MessageResponse> rows = messageRepository.findBySchoolIdAndThreadIdOrderByCreatedAtAsc(actor.schoolId(), threadId)
                .stream()
                .map(this::toMessageResponse)
                .toList();
        participant.setLastReadAt(Instant.now());
        participantRepository.save(participant);
        return rows;
    }

    @Transactional
    public MessageResponse sendMessage(CommunicationActor actor, UUID threadId, MessageCreateRequest request) {
        requireActor(actor);
        requireParticipant(actor, threadId);

        MessageThreadEntity thread = threadRepository.findBySchoolIdAndThreadId(actor.schoolId(), threadId)
                .orElseThrow(() -> new NotFoundException("Thread not found."));

        String body = request.body() == null ? "" : request.body().trim();
        if (body.isBlank()) {
            throw new IllegalArgumentException("Message body is required.");
        }
        if (body.length() > 8000) {
            throw new IllegalArgumentException("Message is too long.");
        }

        Instant now = Instant.now();
        MessageEntity msg = new MessageEntity();
        msg.setMessageId(UUID.randomUUID());
        msg.setSchoolId(actor.schoolId());
        msg.setThreadId(threadId);
        msg.setSenderUserId(actor.userId());
        msg.setBody(body);
        msg.setCreatedAt(now);
        messageRepository.save(msg);

        thread.setUpdatedAt(now);
        thread.setLastMessageAt(now);
        threadRepository.save(thread);

        logger.info("Message sent. schoolId={} threadId={} senderUserId={} bytes={}",
                actor.schoolId(), threadId, actor.userId(), body.length());

        return toMessageResponse(msg);
    }

    @Transactional
    public ThreadReadResponse markThreadRead(CommunicationActor actor, UUID threadId) {
        requireActor(actor);
        MessageThreadParticipantEntity participant = requireParticipant(actor, threadId);
        Instant now = Instant.now();
        participant.setLastReadAt(now);
        participantRepository.save(participant);
        return new ThreadReadResponse(threadId, actor.userId(), now);
    }

    private MessageThreadParticipantEntity requireParticipant(CommunicationActor actor, UUID threadId) {
        if (threadId == null) throw new IllegalArgumentException("threadId is required.");
        MessageThreadParticipantEntity participant = participantRepository
                .findBySchoolIdAndThreadIdAndUserId(actor.schoolId(), threadId, actor.userId())
                .orElse(null);
        if (participant == null) {
            throw new ForbiddenException("You do not have access to this thread.");
        }
        return participant;
    }

    public CommunicationActor resolveActor(String userIdHeader, String schoolIdHeader, String tenantIdHeader, String roleHeader) {
        UUID userId = parseUuid(userIdHeader, "Missing or invalid X-User-ID header.");
        UUID schoolId = parseUuid(schoolIdHeader, "Missing or invalid X-School-ID header.");
        UUID tenantId = tenantIdHeader == null || tenantIdHeader.isBlank() ? null : safeParseUuid(tenantIdHeader.trim());
        String role = roleHeader == null ? "" : roleHeader.trim().toUpperCase(Locale.ROOT);
        return new CommunicationActor(tenantId, schoolId, userId, role);
    }

    private void requireActor(CommunicationActor actor) {
        if (actor == null) throw new IllegalArgumentException("Missing actor context.");
        if (actor.schoolId() == null) throw new IllegalArgumentException("Missing school context.");
        if (actor.userId() == null) throw new IllegalArgumentException("Missing user context.");
    }

    private UUID parseUuid(String raw, String error) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException(error);
        UUID parsed = safeParseUuid(raw.trim());
        if (parsed == null) throw new IllegalArgumentException(error);
        return parsed;
    }

    private UUID safeParseUuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean isRestrictedRole(String role) {
        if (role == null || role.isBlank()) return false;
        String upper = role.toUpperCase(Locale.ROOT);
        return upper.contains("STUDENT") || upper.contains("PARENT");
    }

    private long countUnread(CommunicationActor actor, UUID threadId, Instant lastReadAt) {
        if (lastReadAt == null) {
            return messageRepository.countBySchoolIdAndThreadIdAndSenderUserIdNot(actor.schoolId(), threadId, actor.userId());
        }
        return messageRepository.countBySchoolIdAndThreadIdAndCreatedAtAfterAndSenderUserIdNot(
                actor.schoolId(),
                threadId,
                lastReadAt,
                actor.userId()
        );
    }

    private ThreadResponse toThreadResponse(MessageThreadEntity entity, List<UUID> participants, long unreadCount, Instant lastReadAt) {
        return new ThreadResponse(
                entity.getThreadId(),
                entity.getSchoolId(),
                entity.getSubject(),
                entity.getCreatedByUserId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getLastMessageAt(),
                participants,
                unreadCount,
                lastReadAt
        );
    }

    private MessageResponse toMessageResponse(MessageEntity entity) {
        return new MessageResponse(
                entity.getMessageId(),
                entity.getThreadId(),
                entity.getSchoolId(),
                entity.getSenderUserId(),
                entity.getBody(),
                entity.getCreatedAt()
        );
    }
}
