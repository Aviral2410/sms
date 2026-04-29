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
public class OpenAiFunctionPlanningEngine implements LlmPlanningEngine {
    private final AiInteractionProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    public OpenAiFunctionPlanningEngine(AiInteractionProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        List<ToolCall> calls = new ArrayList<>();
        String apiKey = properties.llm().openaiApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            return calls;
        }
        if (!"OPENAI".equalsIgnoreCase(properties.llm().provider()) && !properties.llm().autoFallback()) {
            return calls;
        }

        String model = properties.llm().openaiModel();
        if (model == null || model.isBlank()) {
            model = "gpt-4o-mini";
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("tool_choice", "auto");

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject()
                    .put("role", "system")
                    .put("content", "Plan the minimum useful platform tools for the request. Return tool calls only when helpful.");

            if (history != null) {
                for (ChatMessageRecord row : history) {
                    if (row.content() == null || row.content().isBlank()) {
                        continue;
                    }
                    messages.addObject()
                            .put("role", "assistant".equalsIgnoreCase(row.role()) ? "assistant" : "user")
                            .put("content", row.content());
                }
            }

            messages.addObject()
                    .put("role", "user")
                    .put("content", "User Role: " + userContext.role().name() + "\nRequest: " + message);

            ArrayNode toolsNode = requestBody.putArray("tools");
            for (ToolDescriptor tool : tools) {
                ObjectNode toolNode = toolsNode.addObject();
                toolNode.put("type", "function");
                ObjectNode function = toolNode.putObject("function");
                function.put("name", tool.name());
                function.put("description", tool.description());
                function.set("parameters", tool.inputSchema());
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return calls;
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode toolCalls = root.path("choices").path(0).path("message").path("tool_calls");
            if (!toolCalls.isArray()) {
                return calls;
            }

            for (JsonNode toolCall : toolCalls) {
                JsonNode function = toolCall.path("function");
                String toolName = function.path("name").asText(null);
                String argsRaw = function.path("arguments").asText("{}");
                if (toolName == null || toolName.isBlank()) {
                    continue;
                }
                JsonNode args = objectMapper.readTree(argsRaw);
                if (args instanceof ObjectNode objectNode) {
                    calls.add(new ToolCall(toolName, objectNode, "OpenAI tool planner"));
                }
            }
        } catch (Exception ignored) {
            return List.of();
        }

        return calls;
    }
}
