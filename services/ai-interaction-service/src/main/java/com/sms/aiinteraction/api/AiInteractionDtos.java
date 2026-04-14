package com.sms.aiinteraction.api;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import java.util.UUID;

public class AiInteractionDtos {
    public record ChatRequest(
            UUID workspaceId,
            UUID conversationId,
            @NotBlank String message,
            Map<String, Object> context
    ) {}

    public record ChatResponse(
            UUID conversationId,
            RenderedResponse response
    ) {}

    public record ConfirmActionRequest(
            @NotBlank String confirmationToken
    ) {}

    public record RenderedResponse(
            String type,
            JsonNode data,
            JsonNode meta
    ) {}

    public record StreamEvent(
            String event,
            JsonNode payload
    ) {}

    public record ToolCatalogItem(
            String name,
            String description,
            JsonNode inputSchema,
            boolean requiresConfirmation,
            java.util.List<String> examplePrompts
    ) {}

    public record PlanToolRateLimits(
            java.util.Map<String, java.util.Map<String, Integer>> limits
    ) {}

    public record RateLimitPolicyResponse(
            String policyVersion,
            java.util.Map<String, java.util.Map<String, Integer>> limits
    ) {}

    public record WorkspaceCreateRequest(
            @NotBlank String name
    ) {}

    public record WorkspaceResponse(
            UUID workspaceId,
            String name,
            String createdAt,
            String updatedAt
    ) {}

    public record ChatCreateRequest(
            String title
    ) {}

    public record ChatSummaryResponse(
            UUID conversationId,
            UUID workspaceId,
            String title,
            String createdAt,
            String updatedAt
    ) {}

    public record ChatMessageResponse(
            UUID messageId,
            String role,
            String content,
            JsonNode payload,
            String timestamp
    ) {}
}
