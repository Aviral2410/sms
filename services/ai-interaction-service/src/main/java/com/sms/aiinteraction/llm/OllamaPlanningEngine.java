package com.sms.aiinteraction.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
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
    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        List<ToolCall> calls = new ArrayList<>();
        String baseUrl = properties.llm().ollamaBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return calls;
        }
        if (!"OLLAMA".equalsIgnoreCase(properties.llm().provider()) && !properties.llm().autoFallback()) {
            return calls;
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", properties.llm().ollamaModel());
            requestBody.put("stream", false);
            requestBody.put("temperature", 0.0);

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject()
                    .put("role", "system")
                    .put("content", buildPrompt(tools));
            messages.addObject()
                    .put("role", "user")
                    .put("content", buildUserPrompt(message, userContext, history));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl.replaceAll("/+$", "") + "/api/chat"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return calls;
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("message").path("content").asText("").trim();
            if (content.isBlank()) {
                return calls;
            }

            JsonNode parsed = parseJson(content);
            if (parsed == null || !parsed.isArray()) {
                return calls;
            }

            for (JsonNode item : parsed) {
                if (!item.isObject()) {
                    continue;
                }
                String toolName = item.path("toolName").asText(null);
                JsonNode args = item.path("arguments");
                if (toolName == null || !(args instanceof ObjectNode objectNode)) {
                    continue;
                }
                calls.add(new ToolCall(toolName, objectNode, item.path("reasoning").asText("Ollama tool planner")));
            }
        } catch (Exception ignored) {
            return List.of();
        }

        return calls;
    }

    private String buildPrompt(List<ToolDescriptor> tools) throws Exception {
        return """
                You are a tool planner for a school management assistant.
                Return ONLY valid JSON.
                Output format: [{"toolName":"...", "arguments":{...}, "reasoning":"..."}]
                Choose zero to four tools.
                Use only the tools below.
                Tools:
                """ + objectMapper.writeValueAsString(tools);
    }

    private String buildUserPrompt(String message, UserContext userContext, List<ChatMessageRecord> history) {
        StringBuilder builder = new StringBuilder();
        builder.append("User Role: ").append(userContext.role().name()).append('\n');
        if (history != null && !history.isEmpty()) {
            builder.append("Recent History:\n");
            history.stream()
                    .filter(item -> item.content() != null && !item.content().isBlank())
                    .limit(8)
                    .forEach(item -> builder.append(item.role()).append(": ").append(item.content()).append('\n'));
        }
        builder.append("Request: ").append(message);
        return builder.toString();
    }

    private JsonNode parseJson(String raw) {
        try {
            int arrayStart = raw.indexOf('[');
            int arrayEnd = raw.lastIndexOf(']');
            if (arrayStart >= 0 && arrayEnd > arrayStart) {
                return objectMapper.readTree(raw.substring(arrayStart, arrayEnd + 1));
            }
            return objectMapper.readTree(raw);
        } catch (Exception ex) {
            return null;
        }
    }
}
