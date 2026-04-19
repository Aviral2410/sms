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
    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<String> history) {
        String provider = properties.llm().provider();
        boolean isOpenAi = "OPENAI".equalsIgnoreCase(provider);
        boolean isOllama = "OLLAMA".equalsIgnoreCase(provider);
        
        if (!isOpenAi && !isOllama) {
            return List.of();
        }

        String baseUrl = isOpenAi ? "https://api.openai.com/v1" : properties.llm().ollamaBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String fullUri = baseUrl + "/chat/completions";

        String model = isOpenAi ? properties.llm().openaiModel() : properties.llm().ollamaModel();
        String apiKey = isOpenAi ? properties.llm().openaiApiKey() : "not-needed";

        if (isOpenAi && (apiKey == null || apiKey.isBlank())) {
            return List.of();
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("temperature", 0);
            requestBody.put("max_tokens", 512);

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject()
                    .put("role", "system")
                    .put("content",
                            "You are an intent planner. Select relevant function calls. Never answer in free text.");
            messages.addObject()
                    .put("role", "user")
                    .put("content", "role=" + userContext.role().name() + ", request=" + message);

            ArrayNode toolNodes = requestBody.putArray("tools");
            for (ToolDescriptor descriptor : tools) {
                ObjectNode tool = toolNodes.addObject();
                tool.put("type", "function");
                ObjectNode function = tool.putObject("function");
                function.put("name", descriptor.name());
                function.put("description", descriptor.description());
                function.set("parameters", descriptor.inputSchema());
            }

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(fullUri))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)));
            
            if (isOpenAi) {
                builder.header("Authorization", "Bearer " + apiKey);
            }

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode toolCalls = root.path("choices").path(0).path("message").path("tool_calls");
            if (!toolCalls.isArray()) return List.of();

            List<ToolCall> calls = new java.util.ArrayList<>();
            for (JsonNode tc : toolCalls) {
                String name = tc.path("function").path("name").asText(null);
                String argsRaw = tc.path("function").path("arguments").asText("{}");
                if (name != null) {
                    JsonNode parsedArgs = objectMapper.readTree(argsRaw);
                    ObjectNode argsNode = parsedArgs.isObject() ? (ObjectNode) parsedArgs : objectMapper.createObjectNode();
                    calls.add(new ToolCall(name, argsNode, "openai_chain_planner"));
                }
            }
            return calls;
        } catch (Exception ex) {
            return List.of();
        }
    }
}
