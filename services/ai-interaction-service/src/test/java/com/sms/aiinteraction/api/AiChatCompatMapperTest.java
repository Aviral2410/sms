package com.sms.aiinteraction.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatCompatMapperTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AiChatCompatMapper mapper = new AiChatCompatMapper(objectMapper);

    @Test
    void mapsTableToDataTableComponent() {
        ArrayNode rows = objectMapper.createArrayNode();
        rows.add(objectMapper.createObjectNode().put("title", "A1").put("priority", "HIGH"));
        rows.add(objectMapper.createObjectNode().put("title", "A2").put("priority", "LOW"));

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("intent", "Announcements");

        AiInteractionDtos.RenderedResponse rendered = new AiInteractionDtos.RenderedResponse("table", rows, meta);
        UUID conversationId = UUID.randomUUID();
        AiInteractionDtos.ChatResponse response = new AiInteractionDtos.ChatResponse(null, conversationId, rendered);

        List<ObjectNode> events = mapper.toStreamEvents(response);
        assertFalse(events.isEmpty());
        ObjectNode component = events.stream()
                .filter(e -> "component".equals(e.path("type").asText()))
                .findFirst()
                .orElse(null);
        assertNotNull(component);
        assertEquals("dataTable", component.path("componentType").asText());
        assertTrue(component.path("props").path("columns").isArray());
        assertTrue(component.path("props").path("rows").isArray());
    }

    @Test
    void mapsChartToChartComponent() {
        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "metric");
        chart.put("yKey", "value");
        chart.putArray("points").add(objectMapper.createObjectNode().put("metric", "present").put("value", 10));

        ObjectNode data = objectMapper.createObjectNode();
        data.set("chart", chart);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", "getAttendanceReport");

        AiInteractionDtos.RenderedResponse rendered = new AiInteractionDtos.RenderedResponse("chart", data, meta);
        UUID conversationId = UUID.randomUUID();
        AiInteractionDtos.ChatResponse response = new AiInteractionDtos.ChatResponse(null, conversationId, rendered);

        List<ObjectNode> events = mapper.toStreamEvents(response);
        ObjectNode component = events.stream()
                .filter(e -> "component".equals(e.path("type").asText()))
                .findFirst()
                .orElse(null);
        assertNotNull(component);
        assertEquals("chart", component.path("componentType").asText());
        assertTrue(component.path("props").hasNonNull("data"));
    }

    @Test
    void streamsTextIntoTextEvents() {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "Hello world");
        AiInteractionDtos.RenderedResponse rendered = new AiInteractionDtos.RenderedResponse("text", data, objectMapper.createObjectNode());
        AiInteractionDtos.ChatResponse response = new AiInteractionDtos.ChatResponse(null, UUID.randomUUID(), rendered);

        List<ObjectNode> events = mapper.toStreamEvents(response);
        assertFalse(events.isEmpty());
        assertTrue(events.stream().allMatch(e -> e.path("type").asText().equals("text") || e.path("type").asText().equals("component")));
        assertTrue(events.get(0).path("content").asText().contains("Hello"));
    }
}

