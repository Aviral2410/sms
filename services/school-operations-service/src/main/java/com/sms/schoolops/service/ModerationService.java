package com.sms.schoolops.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ModerationService {

    private final AIService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ModerationService(AIService aiService) {
        this.aiService = aiService;
    }

    public ModerationResult moderate(String title, String content) {
        if (!aiService.hasLlmKey()) {
            // If No AI key, we default to APPROVED but maybe log a warning.
            // Or we could do basic keyword filtering.
            return new ModerationResult(true, "AI moderation skipped (no key)", 0.0, true);
        }

        String fullContent = (title != null ? title + "\n" : "") + content;
        String prompt = """
                Analyze the following student discussion post for a school forum:
                Content: "%s"

                STRICT RULES:
                1. No abusive language or toxic content.
                2. No teacher or school staff criticism.
                3. Must be academic or study-focused (questions about homework, concepts, exams, etc.).

                Respond in JSON (no markdown):
                {
                  "approved": boolean,
                  "reason": "..." (if blocked),
                  "toxicityScore": 0.0 to 1.0,
                  "isAcademic": boolean
                }
                """.formatted(fullContent);

        try {
            String raw = aiService.callLlm(prompt);
            // AIService.callLlm might return markdown, need to strip it if so.
            // But AIService already has stripMarkdown helper. Since it's private,
            // we'll handle it here or modify AIService to expose it.
            // For now, I'll assume I need to handle it.
            String json = stripMarkdown(raw);
            JsonNode node = objectMapper.readTree(json);

            boolean approved = node.path("approved").asBoolean(true);
            String reason = node.path("reason").asText("");
            double toxicity = node.path("toxicityScore").asDouble(0.0);
            boolean isAcademic = node.path("isAcademic").asBoolean(true);

            // Double check: if it's not academic or toxicity is high, block it.
            if (!isAcademic || toxicity > 0.6) {
                approved = false;
                if (reason.isEmpty()) {
                    reason = !isAcademic ? "Not academic-focused" : "Contains toxic content";
                }
            }

            return new ModerationResult(approved, reason, toxicity, isAcademic);
        } catch (Exception e) {
            // On failure, we might want to flag for human review instead of blocking.
            // For now, we'll allow but log.
            return new ModerationResult(true, "Moderation failed: " + e.getMessage(), 0.0, true);
        }
    }

    private String stripMarkdown(String r) {
        return r != null && r.contains("```") ? r.replaceAll("```(?:json)?", "").trim() : (r == null ? "{}" : r.trim());
    }

    public record ModerationResult(boolean approved, String reason, double toxicityScore, boolean isAcademic) {}
}
