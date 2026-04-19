package com.sms.aiinteraction.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
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
    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<String> history) {
        if (!"OLLAMA".equalsIgnoreCase(properties.llm().provider())) {
            return List.of();
        }
        if (properties.llm().ollamaBaseUrl() == null || properties.llm().ollamaBaseUrl().isBlank()) {
            return List.of();
        }
        if (properties.llm().ollamaModel() == null || properties.llm().ollamaModel().isBlank()) {
            return List.of();
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", properties.llm().ollamaModel());
            requestBody.put("stream", false);
            requestBody.put("temperature", 0.1);

            ArrayNode messages = requestBody.putArray("messages");
            
            StringBuilder systemPrompt = new StringBuilder();
            systemPrompt.append("You are the ElevateSmart AI Orchestrator.\n");
            systemPrompt.append("Goal: Select ONE OR MORE tools to fulfill the user's request. Chaining is encouraged for complex queries.\n");
            systemPrompt.append("Constraint: Output ONLY valid JSON array: [ {\"tool\":\"name\",\"arguments\":{...}} ].\n");
            systemPrompt.append("If no tool is needed, return empty array [].\n");

            messages.addObject().put("role", "system").put("content", systemPrompt.toString());

            ObjectNode toolCatalog = objectMapper.createObjectNode();
            for (ToolDescriptor descriptor : tools) {
                ObjectNode entry = toolCatalog.putObject(descriptor.name());
                entry.put("description", descriptor.description());
                entry.set("parameters", descriptor.inputSchema());
            }

            StringBuilder userPrompt = new StringBuilder();
            userPrompt.append("REQUEST: ").append(message).append("\n");
            userPrompt.append("ROLE: ").append(userContext.role().name()).append("\n");
            userPrompt.append("\nTOOLS:\n").append(objectMapper.writeValueAsString(toolCatalog));

            messages.addObject().put("role", "user").put("content", userPrompt.toString());

            String base = properties.llm().ollamaBaseUrl().replaceAll("/+$", "");
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(base + "/api/chat"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("message").path("content").asText("").trim();
            JsonNode parsed = tryParseJson(content);

            if (parsed == null) return List.of();

            List<ToolCall> calls = new java.util.ArrayList<>();
            if (parsed.isArray()) {
                for (JsonNode node : parsed) {
                    addCall(calls, node);
                }
            } else if (parsed.isObject()) {
                addCall(calls, parsed);
            }
            return calls;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private void addCall(List<ToolCall> list, JsonNode node) {
        String tool = node.path("tool").asText("");
        if (!tool.isBlank() && !"NONE".equalsIgnoreCase(tool)) {
            JsonNode args = node.path("arguments");
            ObjectNode argsNode = args.isObject() ? (ObjectNode) args : objectMapper.createObjectNode();
            list.add(new ToolCall(tool, argsNode, "ollama_chain_planner"));
        }
    }

    private JsonNode tryParseJson(String raw) {
        try {
            int start = raw.indexOf('[');
            int startObj = raw.indexOf('{');
            
            // Try array first
            if (start >= 0 && (start < startObj || startObj < 0)) {
                int end = raw.lastIndexOf(']');
                if (end > start) return objectMapper.readTree(raw.substring(start, end + 1));
            }
            
            // Try object
            if (startObj >= 0) {
                int endObj = raw.lastIndexOf('}');
                if (endObj > startObj) return objectMapper.readTree(raw.substring(startObj, endObj + 1));
            }
            
            return objectMapper.readTree(raw);
        } catch (Exception ex) {
            return null;
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

