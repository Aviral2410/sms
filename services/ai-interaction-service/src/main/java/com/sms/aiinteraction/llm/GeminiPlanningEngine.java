package com.sms.aiinteraction.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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
    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        List<ToolCall> calls = new ArrayList<>();
        String apiKey = properties.llm().geminiApiKey();
        String model = properties.llm().geminiModel();
        
        if (!"GEMINI".equalsIgnoreCase(properties.llm().provider()) && !properties.llm().autoFallback()) return calls;
        if (apiKey == null || apiKey.isBlank()) return calls;
        if (model == null || model.isBlank()) model = "gemini-2.0-flash";

        String url = "https://generativelanguage.googleapis.com/v1/models/" + model + ":generateContent?key=" + apiKey;

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            
            if (history != null) {
                for (ChatMessageRecord msg : history) {
                    if (msg.content() == null || msg.content().isBlank()) continue;
                    ObjectNode content = contents.addObject();
                    content.put("role", "assistant".equalsIgnoreCase(msg.role()) ? "model" : "user");
                    content.putArray("parts").addObject().put("text", msg.content());
                }
            }

            ObjectNode currentContent = contents.addObject();
            currentContent.put("role", "user");
            currentContent.putArray("parts").addObject().put("text", "User Role: " + userContext.role().name() + "\nRequest: " + message);

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
            toolConfig.putObject("function_calling_config").put("mode", "ANY");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) return calls;

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray()) {
                    for (JsonNode part : parts) {
                        JsonNode callNode = part.path("function_call");
                        if (!callNode.isMissingNode()) {
                            String toolName = callNode.path("name").asText(null);
                            if (toolName != null) {
                                calls.add(new ToolCall(toolName, (ObjectNode) callNode.path("args"), "Gemini Multi-Tool Planner"));
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {}
        return calls;
    }
}
