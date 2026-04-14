package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.api.AiInteractionDtos;
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
        return new AiInteractionDtos.RenderedResponse(type, data, meta);
    }

    public AiInteractionDtos.RenderedResponse clarificationResponse(String message) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", message);
        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("intent", "clarification");
        return new AiInteractionDtos.RenderedResponse("text", data, meta);
    }
}
