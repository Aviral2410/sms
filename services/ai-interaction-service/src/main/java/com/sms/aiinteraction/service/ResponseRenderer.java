package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.api.AiInteractionDtos;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class ResponseRenderer {
    private final ObjectMapper objectMapper;

    public ResponseRenderer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AiInteractionDtos.RenderedResponse render(
            String type,
            JsonNode data,
            JsonNode baseMeta,
            boolean cached,
            String intent,
            String reasoning
    ) {
        ObjectNode meta = objectMapper.createObjectNode();
        if (baseMeta != null && baseMeta.isObject()) {
            meta.setAll((ObjectNode) baseMeta);
        }
        meta.put("cached", cached);
        meta.put("intent", intent);
        if (reasoning != null && !reasoning.isBlank()) {
            meta.put("planner", reasoning);
        }
        meta.set("orchestration", buildOrchestration(type, intent, reasoning, data));
        return new AiInteractionDtos.RenderedResponse(type, data, meta);
    }

    public AiInteractionDtos.RenderedResponse clarificationResponse(String message) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", message);
        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("intent", "clarification");
        meta.set("orchestration", buildOrchestration("text", "clarification", null, data));
        return new AiInteractionDtos.RenderedResponse("text", data, meta);
    }

    private ObjectNode buildOrchestration(String type, String intent, String reasoning, JsonNode data) {
        ObjectNode orchestration = objectMapper.createObjectNode();

        String normalizedIntent = intent == null ? "" : intent.toLowerCase(Locale.ROOT);
        boolean looksAnalytics = normalizedIntent.contains("report")
                || normalizedIntent.contains("dashboard")
                || normalizedIntent.contains("analytics")
                || normalizedIntent.contains("overview")
                || normalizedIntent.contains("defaulter")
                || normalizedIntent.contains("leaderboard");

        orchestration.put("mode", looksAnalytics ? "analytics" : "teaching");
        orchestration.put("intent", intent == null ? "" : intent);
        orchestration.put("explanation", reasoning == null ? "" : reasoning);

        ObjectNode visualization = objectMapper.createObjectNode();
        visualization.put("type", type == null ? "text" : type);
        visualization.set("data", data == null ? objectMapper.createObjectNode() : data);
        visualization.set("steps", objectMapper.createArrayNode());
        orchestration.set("visualization", visualization);

        var actions = objectMapper.createArrayNode();
        actions.add(action("simplify", "Simplify"));
        actions.add(action("deep_dive", "Deep dive"));
        if ("table".equals(type) || "chart".equals(type)) {
            actions.add(action("export_csv", "Export CSV"));
        }
        orchestration.set("actions", actions);

        return orchestration;
    }

    private ObjectNode action(String id, String label) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", id);
        node.put("label", label);
        return node;
    }
}
