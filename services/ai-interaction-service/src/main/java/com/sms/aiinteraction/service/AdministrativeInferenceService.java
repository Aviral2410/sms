package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AdministrativeInferenceService {
    private final AiInteractionProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public AdministrativeInferenceService(AiInteractionProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public JsonNode infer(String userQuery, UserContext userContext, String toolName, JsonNode toolData) {
        String provider = properties.llm().provider();
        if ("OLLAMA".equalsIgnoreCase(provider)) {
            return inferWithOllama(userQuery, userContext, toolName, toolData);
        }
        // Fallback to a basic structured wrapper if LLM is unavailable
        return basicStructuredResponse(toolName, toolData);
    }

    private JsonNode inferWithOllama(String userQuery, UserContext userContext, String toolName, JsonNode toolData) {
        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", properties.llm().ollamaModel());
            requestBody.put("stream", false);
            requestBody.put("temperature", 0.0); // Exact schema adherence

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject().put("role", "system").put("content", getSystemPrompt());
            
            StringBuilder userPrompt = new StringBuilder();
            userPrompt.append("User Query: ").append(userQuery).append("\n");
            userPrompt.append("User Role: ").append(userContext.role().name()).append("\n");
            userPrompt.append("Executed Tool: ").append(toolName).append("\n");
            userPrompt.append("Tool Output Data: ").append(objectMapper.writeValueAsString(toolData)).append("\n");
            userPrompt.append("\nReturn the REQUIRED JSON UI response now.");

            messages.addObject().put("role", "user").put("content", userPrompt.toString());

            String base = properties.llm().ollamaBaseUrl().replaceAll("/+$", "");
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(base + "/api/chat"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String content = root.path("message").path("content").asText("").trim();
                return tryParseJson(content);
            }
        } catch (Exception ex) {
            // Log error in production
        }
        return basicStructuredResponse(toolName, toolData);
    }

    private String getSystemPrompt() {
        return """
            You are the AI Operating Layer inside a modern Student Management System (SMS).
            Role: Think like an intelligent school administrator, teacher assistant, student success coach, analyst, and product designer.
            
            STRICT RULES:
            1. Return ONLY valid JSON. No text before or after.
            2. Use curated UI components: kpi_card, table, checklist, alert_banner, chart_bar, chart_line, chart_pie, timeline, kanban.
            3. Never show raw tool JSON. Convert it into clear, beautiful UI components.
            4. Merge data into a 'mixed_dashboard' view if multiple metrics are available.
            
            OUTPUT SCHEMA:
            {
              "intent": "string",
              "title": "A Premium Title",
              "view": "mixed_dashboard | profile | analytics | light",
              "summary": "Concise high-level summary",
              "components": [
                { "type": "kpi_card", "title": "...", "value": "...", "subtitle": "..." },
                { "type": "table", "title": "...", "columns": [...], "rows": [...] }
              ],
              "insights": ["Insight 1", "Insight 2"],
              "actions": [ { "label": "Label", "action": "action_id" } ]
            }
            """;
    }

    private JsonNode tryParseJson(String raw) {
        try {
            int start = raw.indexOf('{');
            int end = raw.lastIndexOf('}');
            if (start >= 0 && end > start) {
                return objectMapper.readTree(raw.substring(start, end + 1));
            }
            return objectMapper.readTree(raw);
        } catch (Exception ex) {
            return null;
        }
    }

    private JsonNode basicStructuredResponse(String toolName, JsonNode toolData) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("intent", "data_view");
        root.put("title", "Service Result: " + toolName);
        root.put("view", "light");
        root.put("summary", "Automated view generated for " + toolName);
        ArrayNode components = root.putArray("components");
        ObjectNode table = components.addObject();
        table.put("type", "table");
        table.put("title", "Raw Data Output");
        // Logic to extract columns/rows from generic toolData would go here
        return root;
    }
}
