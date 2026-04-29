package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.api.AiInteractionDtos;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ConversationOrchestratorTest {

    @Test
    void directReasoningFallbackPersistsThoughtInStoredPayload() {
        ObjectMapper objectMapper = new ObjectMapper();
        ToolPlanningService toolPlanningService = mock(ToolPlanningService.class);
        ToolRegistry toolRegistry = mock(ToolRegistry.class);
        ConversationMemoryService memoryService = mock(ConversationMemoryService.class);
        ResponseRenderer responseRenderer = new ResponseRenderer(objectMapper);
        PendingActionService pendingActionService = mock(PendingActionService.class);
        ToolArgumentValidationService validationService = mock(ToolArgumentValidationService.class);
        RbacPolicyService rbacPolicyService = mock(RbacPolicyService.class);
        RateLimitPolicyService rateLimitPolicyService = mock(RateLimitPolicyService.class);
        ToolRateLimitService toolRateLimitService = mock(ToolRateLimitService.class);
        CacheService cacheService = mock(CacheService.class);
        AuditEventService auditEventService = mock(AuditEventService.class);
        AdministrativeInferenceService inferenceService = mock(AdministrativeInferenceService.class);

        AiInteractionProperties properties = new AiInteractionProperties(
                "http://localhost:8080",
                new AiInteractionProperties.LlmProperties("OLLAMA", "", "", "http://ollama:11434", "llama3.2:3b", "", "", "", "", true),
                new AiInteractionProperties.CacheProperties(90, 300)
        );

        ConversationOrchestrator orchestrator = new ConversationOrchestrator(
                toolPlanningService,
                toolRegistry,
                memoryService,
                responseRenderer,
                objectMapper,
                pendingActionService,
                validationService,
                rbacPolicyService,
                rateLimitPolicyService,
                toolRateLimitService,
                cacheService,
                auditEventService,
                properties,
                inferenceService
        );

        UserContext user = user(UserRole.TEACHER);
        UUID workspaceId = UUID.fromString("16c20278-f8b7-4c80-9103-5f6628dfd2a7");
        UUID conversationId = UUID.fromString("8c8c8d3e-1fd6-4f3f-bd3c-88cc36ae4454");

        when(memoryService.ensureDefaultWorkspace(user)).thenReturn(
                new ConversationMemoryService.WorkspaceRecord(workspaceId, user.userId(), user.tenantId(), user.schoolId(), "Default Workspace", Instant.now(), Instant.now())
        );
        when(memoryService.ensureChat(eq(user), any(), eq(workspaceId), eq("Explain Newton's second law")))
                .thenReturn(new ConversationMemoryService.ChatRecord(conversationId, workspaceId, user.userId(), "Physics", Instant.now(), Instant.now()));
        when(memoryService.listMessages(user, conversationId, 10)).thenReturn(List.of());
        when(toolRegistry.all()).thenReturn(List.of());
        when(toolPlanningService.plan(eq("Explain Newton's second law"), eq(user), any(), any())).thenReturn(List.of());
        when(cacheService.get(any())).thenReturn(Optional.empty());

        ObjectNode directReasoning = objectMapper.createObjectNode();
        directReasoning.put("title", "Newton's Second Law");
        directReasoning.put("summary", "Force equals mass times acceleration.");
        ArrayNode components = directReasoning.putArray("components");
        components.addObject().put("type", "formula_card").put("title", "Law").put("latex", "F = ma");
        when(inferenceService.infer(eq("Explain Newton's second law"), eq(user), any())).thenReturn(directReasoning);

        doNothing().when(auditEventService).requestReceived(eq(user), eq("Explain Newton's second law"), any());

        AiInteractionDtos.ChatResponse response = orchestrator.chat(
                user,
                new AiInteractionDtos.ChatRequest(null, null, "Explain Newton's second law", null)
        );

        assertNotNull(response);
        assertEquals("smart_ui", response.response().type());
        assertEquals("Newton's Second Law", response.response().data().path("title").asText());

        ArgumentCaptor<ObjectNode> payloadCaptor = ArgumentCaptor.forClass(ObjectNode.class);
        verify(memoryService).addAssistantResponse(eq(user), eq(conversationId), eq("Force equals mass times acceleration."), payloadCaptor.capture());
        assertEquals(
                "I could not map this cleanly to a platform action, so I generated a direct reasoning response instead.",
                payloadCaptor.getValue().path("thought").asText()
        );
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
                "req-orchestrator",
                null
        );
    }
}
