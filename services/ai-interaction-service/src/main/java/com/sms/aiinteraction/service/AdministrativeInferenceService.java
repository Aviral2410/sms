package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AdministrativeInferenceService {
    private static final Logger log = LoggerFactory.getLogger(AdministrativeInferenceService.class);
    private final AiInteractionProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public AdministrativeInferenceService(AiInteractionProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public JsonNode infer(String userQuery, UserContext userContext, JsonNode toolResults) {
        String provider = properties.llm().provider();
        
        if ("GEMINI".equalsIgnoreCase(provider)) {
            JsonNode geminiRes = inferWithGemini(userQuery, userContext, toolResults);
            if (geminiRes != null) return geminiRes;
        }
        
        if ("OLLAMA".equalsIgnoreCase(provider) || properties.llm().autoFallback()) {
            JsonNode ollamaRes = inferWithOllama(userQuery, userContext, toolResults);
            if (ollamaRes != null) return ollamaRes;
        }

        return basicStructuredResponse(toolResults);
    }

    private JsonNode inferWithGemini(String userQuery, UserContext userContext, JsonNode toolResults) {
        String apiKey = properties.llm().geminiApiKey();
        String model = properties.llm().geminiModel();
        if (apiKey == null || apiKey.isBlank()) return null;
        if (model == null || model.isBlank()) model = "gemini-2.0-flash";

        String url = "https://generativelanguage.googleapis.com/v1/models/" + model + ":generateContent?key=" + apiKey;

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode content = contents.addObject();
            content.put("role", "user");
            ArrayNode parts = content.putArray("parts");
            
            StringBuilder prompt = new StringBuilder();
            prompt.append(getSystemPrompt());
            prompt.append("\n\nUser Question: ").append(userQuery);
            prompt.append("\nUser Role: ").append(userContext.role().name());
            prompt.append("\nAvailable Data (from multiple tools):\n").append(objectMapper.writeValueAsString(toolResults));
            prompt.append("\n\nNow, generate the synthesized Dashboard JSON response.");

            parts.addObject().put("text", prompt.toString());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText("");
                return tryParseJson(text);
            }
        } catch (Exception ex) {
            log.error("Gemini inference failed", ex);
        }
        return null;
    }

    private JsonNode inferWithOllama(String userQuery, UserContext userContext, JsonNode toolResults) {
        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", properties.llm().ollamaModel());
            requestBody.put("stream", false);
            requestBody.put("temperature", 0.0);

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject().put("role", "system").put("content", getSystemPrompt());
            
            StringBuilder userPrompt = new StringBuilder();
            userPrompt.append("User Query: ").append(userQuery).append("\n");
            userPrompt.append("User Role: ").append(userContext.role().name()).append("\n");
            userPrompt.append("Multi-Tool Outputs Context:\n").append(objectMapper.writeValueAsString(toolResults)).append("\n");
            userPrompt.append("\nSynthesize all data sources. Return the REQUIRED JSON UI response now.");

            messages.addObject().put("role", "user").put("content", userPrompt.toString());

            String base = properties.llm().ollamaBaseUrl();
            if (base == null || base.isBlank()) return null;
            base = base.replaceAll("/+$", "");
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(base + "/api/chat"))
                    .timeout(Duration.ofSeconds(45))
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
            log.error("Ollama inference failed", ex);
        }
        return null;
    }

    private String getSystemPrompt() {
        return """
            You are the STRATEGIC SYNTHESIS LAYER of a production-grade School Management System.
            Your task is to take RAW tool results and convert them into an ACTIONABLE Dashboard JSON.
            
            STRICT RULES:
            - Return ONLY valid JSON.
            - Role-dependent views: Admin sees high-level KPIs; Teachers see student trends.
            
            SCHEMA:
            {
              "intent": "string",
              "title": "Synthesis Dashboard",
              "summary": "Executive summary",
              "components": [
                { "type": "kpi_card", "title": "Total Revenue", "value": "$1.2M", "trend": "+12%" },
                { "type": "chart_bar", "title": "Revenue by Region", "labels": ["West", "East"], "series": [500, 700] },
                { "type": "table", "title": "Anomalous Schools", "columns": ["Name", "Reason"], "rows": [...] }
              ],
              "insights": ["Insight 1", "Insight 2"],
              "actions": [{ "label": "Download Report", "action": "export_csv" }]
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

    private JsonNode basicStructuredResponse(JsonNode toolResults) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("intent", "multi_data_view");
        root.put("title", "Aggregated Intelligence");
        root.put("view", "mixed");
        root.put("summary", "Automatically synthesized results from multiple neural services.");
        ArrayNode components = root.putArray("components");
        
        if (toolResults.isObject()) {
            toolResults.fields().forEachRemaining(entry -> {
                ObjectNode table = components.addObject();
                table.put("type", "table");
                table.put("title", "Data Source: " + entry.getKey());
                table.set("data", entry.getValue());
            });
        }
        
        return root;
    }
}
