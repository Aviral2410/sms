package com.sms.aiinteraction.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

final class AiChatCompatMapper {
    private static final int DEFAULT_TEXT_CHUNK_SIZE = 80;
    private final ObjectMapper objectMapper;

    AiChatCompatMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    List<ObjectNode> toStreamEvents(AiInteractionDtos.ChatResponse response) {
        List<ObjectNode> out = new ArrayList<>();
        if (response == null || response.response() == null) {
            out.add(textEvent("No response."));
            return out;
        }

        AiInteractionDtos.RenderedResponse rendered = response.response();
        String type = rendered.type() == null ? "text" : rendered.type().trim().toLowerCase(Locale.ROOT);

        if ("chart".equals(type)) {
            out.add(textEvent("Here’s a chart based on your request."));
            ObjectNode props = objectMapper.createObjectNode();
            props.put("type", "bar");
            props.put("title", resolveTitle(rendered.meta(), "Chart"));
            props.set("data", resolveChartData(rendered.data()));
            out.add(componentEvent("chart", props));
            return out;
        }

        if ("table".equals(type)) {
            out.add(textEvent("Here’s a table based on your request."));
            ObjectNode props = objectMapper.createObjectNode();
            props.put("title", resolveTitle(rendered.meta(), "Table"));
            ObjectNode table = toDataTable(rendered.data());
            props.set("columns", table.get("columns"));
            props.set("rows", table.get("rows"));
            out.add(componentEvent("dataTable", props));
            return out;
        }

        if ("action".equals(type)) {
            // The Claude-like UI spec supports interactive components, but our platform actions are
            // confirmation-driven and UI-specific. Keep this compatibility API text-only for now.
            out.addAll(streamText(resolveBestEffortText(rendered)));
            return out;
        }

        out.addAll(streamText(resolveBestEffortText(rendered)));
        return out;
    }

    ObjectNode completeEvent(String userMessage, List<ObjectNode> sentEvents, UUID conversationId) {
        int promptTokens = estimateTokens(userMessage);
        int completionTokens = estimateCompletionTokens(sentEvents);

        ObjectNode usage = objectMapper.createObjectNode();
        usage.put("prompt_tokens", promptTokens);
        usage.put("completion_tokens", completionTokens);
        usage.put("total_tokens", promptTokens + completionTokens);

        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "complete");
        node.set("usage", usage);
        if (conversationId != null) {
            node.put("conversation_id", conversationId.toString());
        }
        return node;
    }

    ObjectNode errorEvent(String message) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "error");
        node.put("error", message == null ? "Unknown error" : message);
        return node;
    }

    private List<ObjectNode> streamText(String fullText) {
        String safe = fullText == null ? "" : fullText;
        if (safe.isBlank()) {
            return List.of(textEvent(""));
        }

        List<ObjectNode> out = new ArrayList<>();
        int idx = 0;
        while (idx < safe.length()) {
            int end = Math.min(safe.length(), idx + DEFAULT_TEXT_CHUNK_SIZE);
            out.add(textEvent(safe.substring(idx, end)));
            idx = end;
        }
        return out;
    }

    private ObjectNode textEvent(String content) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "text");
        node.put("content", content == null ? "" : content);
        return node;
    }

    private ObjectNode componentEvent(String componentType, JsonNode props) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "component");
        node.put("componentType", componentType == null ? "" : componentType);
        node.set("props", props == null ? objectMapper.createObjectNode() : props);
        return node;
    }

    private String resolveTitle(JsonNode meta, String fallback) {
        if (meta != null) {
            String intent = meta.path("intent").asText("");
            if (!intent.isBlank()) return intent;
            String tool = meta.path("tool").asText("");
            if (!tool.isBlank()) return tool;
        }
        return fallback;
    }

    private JsonNode resolveChartData(JsonNode renderedData) {
        if (renderedData != null && renderedData.hasNonNull("chart")) {
            return renderedData.get("chart");
        }
        return renderedData == null ? objectMapper.createObjectNode() : renderedData;
    }

    private ObjectNode toDataTable(JsonNode data) {
        ObjectNode out = objectMapper.createObjectNode();
        ArrayNode columns = objectMapper.createArrayNode();
        ArrayNode rows = objectMapper.createArrayNode();
        out.set("columns", columns);
        out.set("rows", rows);

        if (data == null) return out;

        if (data.isArray()) {
            List<JsonNode> items = new ArrayList<>();
            data.forEach(items::add);

            Set<String> colSet = new LinkedHashSet<>();
            for (JsonNode item : items) {
                if (item != null && item.isObject()) {
                    item.fieldNames().forEachRemaining(colSet::add);
                }
                if (colSet.size() >= 12) break;
            }
            if (colSet.isEmpty()) {
                columns.add("value");
                for (JsonNode item : items) {
                    ArrayNode row = rows.addArray();
                    row.add(stringifyCell(item));
                }
                return out;
            }

            colSet.forEach(columns::add);
            for (JsonNode item : items) {
                ArrayNode row = rows.addArray();
                if (item != null && item.isObject()) {
                    for (String col : colSet) {
                        row.add(stringifyCell(item.get(col)));
                    }
                } else {
                    row.add(stringifyCell(item));
                    for (int i = 1; i < colSet.size(); i++) row.add("");
                }
            }
            return out;
        }

        if (data.isObject()) {
            columns.add("key");
            columns.add("value");
            Iterator<String> names = data.fieldNames();
            while (names.hasNext()) {
                String key = names.next();
                ArrayNode row = rows.addArray();
                row.add(key);
                row.add(stringifyCell(data.get(key)));
            }
            return out;
        }

        columns.add("value");
        rows.addArray().add(stringifyCell(data));
        return out;
    }

    private String resolveBestEffortText(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) return "";
        JsonNode data = rendered.data();
        if (data != null && data.hasNonNull("text")) {
            return data.get("text").asText("");
        }
        if (data != null && data.hasNonNull("message")) {
            return data.get("message").asText("");
        }
        if (data != null && data.isTextual()) {
            return data.asText("");
        }
        try {
            return data == null ? "" : objectMapper.writeValueAsString(data);
        } catch (Exception ex) {
            return "";
        }
    }

    private int estimateTokens(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }

    private int estimateCompletionTokens(List<ObjectNode> sentEvents) {
        if (sentEvents == null || sentEvents.isEmpty()) return 0;
        int sum = 0;
        for (ObjectNode node : sentEvents) {
            if (node == null) continue;
            if (!"text".equals(node.path("type").asText())) continue;
            sum += estimateTokens(node.path("content").asText(""));
        }
        return sum;
    }

    private String stringifyCell(JsonNode node) {
        if (node == null || node.isNull()) return "";
        if (node.isTextual()) return node.asText();
        if (node.isNumber() || node.isBoolean()) return node.asText();
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception ex) {
            return node.asText("");
        }
    }
}

