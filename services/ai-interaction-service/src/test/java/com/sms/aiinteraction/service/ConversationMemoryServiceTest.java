package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConversationMemoryServiceTest {

    @Test
    void clearMessagesRemovesExistingHistoryInFallbackMode() {
        ObjectProvider<StringRedisTemplate> provider = Mockito.mock(ObjectProvider.class);
        Mockito.when(provider.getIfAvailable()).thenReturn(null);

        ConversationMemoryService service = new ConversationMemoryService(new ObjectMapper(), provider);
        UserContext user = user(UserRole.SCHOOL_ADMIN);

        ConversationMemoryService.WorkspaceRecord ws = service.createWorkspace(user, "WS");
        ConversationMemoryService.ChatRecord chat = service.createChat(user, ws.workspaceId(), "Chat");

        service.addUserMessage(user, chat.conversationId(), "Hello");
        service.addAssistantResponse(user, chat.conversationId(), "Hi there", null);

        assertEquals(2, service.listMessages(user, chat.conversationId(), 50).size());

        service.clearMessages(user, chat.conversationId());

        assertTrue(service.listMessages(user, chat.conversationId(), 50).isEmpty());
    }

    private UserContext user(UserRole role) {
        return new UserContext(
                UUID.fromString("4f2f9e5a-43e0-4fb6-8652-2a9f2c819c83"),
                UUID.fromString("f56f6db0-cf66-4f80-b9d5-b96d95f73ff0"),
                UUID.fromString("412c9f44-c2d4-4ac8-b6c0-df1ef170f6f2"),
                "user@example.com",
                role.name(),
                role,
                "Bearer fake",
                "req-mem",
                null
        );
    }
}

