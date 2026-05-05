package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
        return renderWithThought(type, data, baseMeta, cached, intent, reasoning, null);
    }

    public AiInteractionDtos.RenderedResponse renderWithThought(
            String type,
            JsonNode data,
            JsonNode baseMeta,
            boolean cached,
            String intent,
            String reasoning,
            String thought
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
        return new AiInteractionDtos.RenderedResponse(type, data, meta, thought);
    }

    public AiInteractionDtos.RenderedResponse clarificationResponse(String message) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", message);
        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("intent", "clarification");
        meta.set("orchestration", buildOrchestration("text", "clarification", null, data));
        return new AiInteractionDtos.RenderedResponse("text", data, meta, null);
    }

    public AiInteractionDtos.RenderedResponse composeForAssistant(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) {
            return null;
        }

        String type = rendered.type() == null ? "text" : rendered.type();
        if ("composed".equals(type) || "mixed".equals(type) || "action".equals(type) || "status".equals(type) || "error".equals(type)) {
            return rendered;
        }

        return switch (type) {
            case "smart_ui" -> composeSmartUi(rendered);
            case "table" -> composeTable(rendered);
            case "chart" -> composeChart(rendered);
            default -> rendered;
        };
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

    private AiInteractionDtos.RenderedResponse composeSmartUi(AiInteractionDtos.RenderedResponse rendered) {
        ObjectNode source = rendered.data() != null && rendered.data().isObject()
                ? (ObjectNode) rendered.data()
                : objectMapper.createObjectNode();

        ObjectNode data = baseComposedData(rendered, source);
        ArrayNode sections = data.putArray("sections");

        ArrayNode insights = arrayFrom(source.get("insights"));
        if (!insights.isEmpty()) {
            ObjectNode section = sections.addObject();
            section.put("kind", "markdown");
            section.put("title", "What stands out");
            section.put("content", bulletList(insights));
        }

        if (hasMeaningfulSmartUiBody(source)) {
            ObjectNode section = sections.addObject();
            section.put("kind", "smart_ui");
            section.put("title", "Structured view");
            section.set("response", compactSmartUi(source));
        }

        ArrayNode actions = arrayFrom(source.get("actions"));
        if (!actions.isEmpty()) {
            ObjectNode section = sections.addObject();
            section.put("kind", "suggestions");
            section.put("title", "Continue with");
            ArrayNode items = section.putArray("items");
            actions.forEach(action -> {
                if (action.isObject()) {
                    ObjectNode item = items.addObject();
                    item.put("label", action.path("label").asText("Next step"));
                    if (action.hasNonNull("id")) {
                        item.put("id", action.path("id").asText());
                    }
                } else if (action.isTextual()) {
                    items.add(action.asText());
                }
            });
        }

        return new AiInteractionDtos.RenderedResponse("composed", data, withSourceType(rendered.meta(), rendered.type()), rendered.thought());
    }

    private AiInteractionDtos.RenderedResponse composeTable(AiInteractionDtos.RenderedResponse rendered) {
        ObjectNode source = rendered.data() != null && rendered.data().isObject()
                ? (ObjectNode) rendered.data()
                : objectMapper.createObjectNode();
        ObjectNode data = baseComposedData(rendered, source);
        ArrayNode sections = data.putArray("sections");

        if (source.has("rows") && source.get("rows").isArray()) {
            ObjectNode section = sections.addObject();
            section.put("kind", "table");
            section.put("title", titleFor(rendered, source, "Structured table"));
            if (source.hasNonNull("description")) {
                section.put("description", source.path("description").asText());
            }
            section.set("rows", source.get("rows"));
        }

        ObjectNode snapshot = snapshotData(source);
        if (!snapshot.isEmpty()) {
            ObjectNode section = sections.addObject();
            section.put("kind", "snapshot");
            section.put("title", "Supporting details");
            section.set("data", snapshot);
        }

        return new AiInteractionDtos.RenderedResponse("composed", data, withSourceType(rendered.meta(), rendered.type()), rendered.thought());
    }

    private AiInteractionDtos.RenderedResponse composeChart(AiInteractionDtos.RenderedResponse rendered) {
        ObjectNode source = rendered.data() != null && rendered.data().isObject()
                ? (ObjectNode) rendered.data()
                : objectMapper.createObjectNode();
        ObjectNode data = baseComposedData(rendered, source);
        ArrayNode sections = data.putArray("sections");

        JsonNode chart = source.get("chart");
        if (chart != null && chart.isObject()) {
            ObjectNode section = sections.addObject();
            section.put("kind", "chart");
            section.put("title", titleFor(rendered, source, "Trend"));
            section.set("chart", chart);
        }

        ObjectNode snapshot = snapshotData(source);
        if (!snapshot.isEmpty()) {
            ObjectNode section = sections.addObject();
            section.put("kind", "snapshot");
            section.put("title", "Supporting details");
            section.set("data", snapshot);
        }

        return new AiInteractionDtos.RenderedResponse("composed", data, withSourceType(rendered.meta(), rendered.type()), rendered.thought());
    }

    private ObjectNode baseComposedData(AiInteractionDtos.RenderedResponse rendered, ObjectNode source) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("title", titleFor(rendered, source, "Aura response"));

        String summary = firstNonBlank(
                textValue(source, "summary"),
                textValue(source, "text"),
                textValue(source, "message"),
                rendered.thought()
        );
        if (summary != null) {
            data.put("summary", summary);
        }
        return data;
    }

    private ObjectNode compactSmartUi(ObjectNode source) {
        ObjectNode compact = objectMapper.createObjectNode();
        if (source.has("view")) {
            compact.set("view", source.get("view"));
        }
        if (source.has("components")) {
            compact.set("components", source.get("components"));
        }
        if (source.has("actions")) {
            compact.set("actions", source.get("actions"));
        }
        if (source.has("insights")) {
            compact.set("insights", source.get("insights"));
        }
        return compact;
    }

    private ObjectNode snapshotData(ObjectNode source) {
        ObjectNode snapshot = objectMapper.createObjectNode();
        source.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode value = entry.getValue();
            if ("rows".equals(key) || "chart".equals(key) || "summary".equals(key) || "text".equals(key) || "message".equals(key) || "title".equals(key)) {
                return;
            }
            if (value == null || value.isNull()) {
                return;
            }
            snapshot.set(key, value);
        });
        return snapshot;
    }

    private boolean hasMeaningfulSmartUiBody(ObjectNode source) {
        return (source.has("components") && source.get("components").isArray() && !source.get("components").isEmpty())
                || (source.has("actions") && source.get("actions").isArray() && !source.get("actions").isEmpty())
                || (source.has("insights") && source.get("insights").isArray() && !source.get("insights").isEmpty());
    }

    private ArrayNode arrayFrom(JsonNode node) {
        if (node != null && node.isArray()) {
            return (ArrayNode) node;
        }
        return objectMapper.createArrayNode();
    }

    private String bulletList(ArrayNode items) {
        StringBuilder builder = new StringBuilder();
        items.forEach(item -> {
            String value = item.isTextual() ? item.asText() : item.toString();
            if (!value.isBlank()) {
                if (!builder.isEmpty()) {
                    builder.append('\n');
                }
                builder.append("- ").append(value);
            }
        });
        return builder.toString();
    }

    private ObjectNode withSourceType(JsonNode meta, String sourceType) {
        ObjectNode node = objectMapper.createObjectNode();
        if (meta != null && meta.isObject()) {
            node.setAll((ObjectNode) meta);
        }
        if (sourceType != null && !sourceType.isBlank()) {
            node.put("sourceType", sourceType);
        }
        return node;
    }

    private String titleFor(AiInteractionDtos.RenderedResponse rendered, ObjectNode source, String fallback) {
        return firstNonBlank(
                textValue(source, "title"),
                metaValue(rendered.meta(), "intent"),
                fallback
        );
    }

    private String textValue(ObjectNode node, String field) {
        if (node != null && node.hasNonNull(field)) {
            String value = node.path(field).asText("");
            if (!value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String metaValue(JsonNode node, String field) {
        if (node != null && node.hasNonNull(field)) {
            String value = node.path(field).asText("");
            if (!value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String firstNonBlank(String... candidates) {
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }
}
