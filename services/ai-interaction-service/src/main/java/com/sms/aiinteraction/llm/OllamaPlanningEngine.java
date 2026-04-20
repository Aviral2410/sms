package com.sms.aiinteraction.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class OllamaPlanningEngine implements LlmPlanningEngine {
    private final AiInteractionProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    public OllamaPlanningEngine(AiInteractionProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools) {
        if (!"OLLAMA".equalsIgnoreCase(properties.llm().provider())) {
            return Optional.empty();
        }
        if (properties.llm().ollamaBaseUrl() == null || properties.llm().ollamaBaseUrl().isBlank()) {
            return Optional.empty();
        }
        if (properties.llm().ollamaModel() == null || properties.llm().ollamaModel().isBlank()) {
            return Optional.empty();
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", properties.llm().ollamaModel());
            requestBody.put("stream", false);
            requestBody.put("temperature", 0);

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject()
                    .put("role", "system")
                    .put("content",
                            "You are an intent planner. Choose exactly one tool for the user's request. "
                                    + "Output ONLY a single JSON object with either "
                                    + "{\"tool\":\"<tool_name>\",\"arguments\":{...}} or {\"tool\":\"NONE\"}. "
                                    + "Do not include markdown.");

            ObjectNode toolCatalog = objectMapper.createObjectNode();
            for (ToolDescriptor descriptor : tools) {
                ObjectNode entry = toolCatalog.putObject(descriptor.name());
                entry.put("description", descriptor.description());
                entry.set("parameters", descriptor.inputSchema());
            }
            messages.addObject()
                    .put("role", "user")
                    .put("content",
                            "role=" + userContext.role().name()
                                    + "\nrequest=" + message
                                    + "\n\nTOOLS=" + objectMapper.writeValueAsString(toolCatalog));

            String base = properties.llm().ollamaBaseUrl().replaceAll("/+$", "");
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(base + "/api/chat"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("message").path("content").asText("");
            if (content == null || content.isBlank()) {
                return Optional.empty();
            }

            JsonNode parsed = tryParseJsonObject(content.trim());
            if (parsed == null || !parsed.isObject()) {
                return Optional.empty();
            }
            String tool = parsed.path("tool").asText("");
            if (tool.isBlank() || "NONE".equalsIgnoreCase(tool)) {
                return Optional.empty();
            }
            JsonNode args = parsed.path("arguments");
            ObjectNode argsNode = args != null && args.isObject() ? (ObjectNode) args : objectMapper.createObjectNode();
            return Optional.of(new ToolCall(tool, argsNode, "ollama_json_planner"));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (IOException ex) {
            return Optional.empty();
        }
    }

    private JsonNode tryParseJsonObject(String raw) {
        try {
            return objectMapper.readTree(raw);
        } catch (Exception ignored) {
            // fallthrough
        }
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        String slice = raw.substring(start, end + 1);
        try {
            return objectMapper.readTree(slice);
        } catch (Exception ignored) {
            return null;
        }
    }
}

