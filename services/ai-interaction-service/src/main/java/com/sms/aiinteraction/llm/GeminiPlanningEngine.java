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
public class GeminiPlanningEngine implements LlmPlanningEngine {
    private final AiInteractionProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    public GeminiPlanningEngine(AiInteractionProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools) {
        String apiKey = properties.llm().geminiApiKey();
        String model = properties.llm().geminiModel();
        
        // Only run if Gemini is the selected provider OR if auto-fallback is enabled
        boolean isSelected = "GEMINI".equalsIgnoreCase(properties.llm().provider());
        boolean canFallback = properties.llm().autoFallback();
        
            return Optional.empty();
        }
        if (apiKey == null || apiKey.isBlank()) {
            return Optional.empty();
        }
        if (model == null || model.isBlank()) {
            model = "gemini-2.0-flash";
        }

        String url = "https://generativelanguage.googleapis.com/v1/models/" + model + ":generateContent?key=" + apiKey;

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode content = contents.addObject();
            content.put("role", "user");
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", "User Role: " + userContext.role().name() + "\nUser Request: " + message);

            ArrayNode toolsNode = requestBody.putArray("tools");
            ObjectNode toolEntry = toolsNode.addObject();
            ArrayNode functionDeclarations = toolEntry.putArray("function_declarations");
            
            for (ToolDescriptor tool : tools) {
                ObjectNode fd = functionDeclarations.addObject();
                fd.put("name", tool.name());
                fd.put("description", tool.description());
                fd.set("parameters", tool.inputSchema());
            }

            ObjectNode toolConfig = requestBody.putObject("tool_config");
            ObjectNode functionCallingConfig = toolConfig.putObject("function_calling_config");
            functionCallingConfig.put("mode", "ANY");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidate = root.path("candidates").path(0);
            JsonNode callNode = candidate.path("content").path("parts").path(0).path("function_call");
            
            String toolName = callNode.path("name").asText(null);
            if (toolName == null || toolName.isBlank()) {
                return Optional.empty();
            }

            JsonNode args = callNode.path("args");
            ObjectNode argsNode = args.isObject() ? (ObjectNode) args : objectMapper.createObjectNode();
            
            return Optional.of(new ToolCall(toolName, argsNode, "gemini_planner"));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (IOException ex) {
            return Optional.empty();
        }
    }
}
