package com.sms.aiinteraction.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.AuditEventService;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.service.IdempotencyService;
import com.sms.aiinteraction.tool.impl.SendNotificationTool;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class SendNotificationToolIdempotencyTest {
    private final GatewayApiClient gatewayApiClient = Mockito.mock(GatewayApiClient.class);
    private final IdempotencyService idempotencyService = Mockito.mock(IdempotencyService.class);
    private final AuditEventService auditEventService = Mockito.mock(AuditEventService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void skipsDuplicateNotificationWhenIdempotencyClaimFails() {
        Mockito.when(idempotencyService.claim(any(), anyString(), anyString(), any())).thenReturn(false);
        SendNotificationTool tool = new SendNotificationTool(gatewayApiClient, objectMapper, idempotencyService, auditEventService);

        ObjectNode args = objectMapper.createObjectNode();
        args.put("recipientUserId", "7df300c8-4695-4a86-a8bb-b3efebea3077");
        args.put("title", "Reminder");
        args.put("message", "Fees due tomorrow");

        ToolResult result = tool.execute(args, user());

        assertEquals("action", result.outputType());
        assertEquals("DUPLICATE_SKIPPED", result.data().path("status").asText());
        verify(gatewayApiClient, never()).post(anyString(), any(), anyString());
    }

    private UserContext user() {
        return new UserContext(
                UUID.fromString("57ec9ecf-fefe-4ea2-8a11-d07c600666ad"),
                UUID.fromString("d27430dc-fd62-4cb1-a95c-5f66be1179b8"),
                UUID.fromString("6608a3d4-2fc1-425f-843d-a6cc8db7c330"),
                "teacher@example.com",
                "TEACHER",
                UserRole.TEACHER,
                "Bearer fake",
                "req-2",
                null
        );
    }
}
