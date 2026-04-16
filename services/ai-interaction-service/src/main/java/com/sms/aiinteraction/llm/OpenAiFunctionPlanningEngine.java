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
    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools) {
        String provider = properties.llm().provider();
        boolean isOpenAi = "OPENAI".equalsIgnoreCase(provider);
        boolean isOllama = "OLLAMA".equalsIgnoreCase(provider);
        
        if (!isOpenAi && !isOllama) {
            return Optional.empty();
        }

        String baseUrl = isOpenAi ? "https://api.openai.com/v1" : properties.llm().ollamaBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String fullUri = baseUrl + "/chat/completions";

        String model = isOpenAi ? properties.llm().openaiModel() : properties.llm().ollamaModel();
        String apiKey = isOpenAi ? properties.llm().openaiApiKey() : "not-needed";

        if (isOpenAi && (apiKey == null || apiKey.isBlank())) {
            return Optional.empty();
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("temperature", 0);
            requestBody.put("max_tokens", 256);

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject()
                    .put("role", "system")
                    .put("content",
                            "You are an intent planner. Select exactly one function call based on user request and role scope. "
                                    + "Never answer in free text.");
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
                    .timeout(Duration.ofSeconds(12))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)));
            
            if (isOpenAi) {
                builder.header("Authorization", "Bearer " + apiKey);
            }

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode toolCall = root.path("choices").path(0).path("message").path("tool_calls").path(0);
            String name = toolCall.path("function").path("name").asText(null);
            String argsRaw = toolCall.path("function").path("arguments").asText("{}");

            if (name == null || name.isBlank()) {
                return Optional.empty();
            }

            JsonNode parsedArgs = objectMapper.readTree(argsRaw);
            ObjectNode argsNode = parsedArgs.isObject() ? (ObjectNode) parsedArgs : objectMapper.createObjectNode();
            return Optional.of(new ToolCall(name, argsNode, "openai_function_calling"));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (IOException ex) {
            return Optional.empty();
        }
    }
}
