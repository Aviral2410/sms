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
        
        // Step 3 & 4: Intent Detection and Response Planning
        String intent = detectIntent(userQuery);
        String plan = planResponse(intent);
        
        if ("GEMINI".equalsIgnoreCase(provider)) {
            JsonNode geminiRes = inferWithGemini(userQuery, userContext, toolResults, intent, plan);
            if (geminiRes != null) return geminiRes;
        }
        
        if ("OLLAMA".equalsIgnoreCase(provider) || properties.llm().autoFallback()) {
            JsonNode ollamaRes = inferWithOllama(userQuery, userContext, toolResults, intent, plan);
            if (ollamaRes != null) return ollamaRes;
        }

        return basicStructuredResponse(toolResults);
    }

    private JsonNode inferWithGemini(String userQuery, UserContext userContext, JsonNode toolResults, String intent, String plan) {
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
            prompt.append("\nDetected Intent: ").append(intent);
            prompt.append("\nRequired Response Plan: ").append(plan);
            prompt.append("\nAvailable Data (from tools):\n").append(objectMapper.writeValueAsString(toolResults));
            prompt.append("\n\nGenerate the structured JSON response according to the plan.");

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

    private JsonNode inferWithOllama(String userQuery, UserContext userContext, JsonNode toolResults, String intent, String plan) {
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
            userPrompt.append("Intent: ").append(intent).append("\n");
            userPrompt.append("Plan: ").append(plan).append("\n");
            userPrompt.append("Context Data:\n").append(objectMapper.writeValueAsString(toolResults)).append("\n");
            userPrompt.append("\nReturn the REQUIRED JSON response.");

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
            You are Aura, the autonomous orchestrator of a production-grade School Management System.
            You have access to high-fidelity platform tools and historical context.
            
            CORE PRINCIPLES:
            1. TOOL FIDELITY: If a query requires real-time data (fees, students, attendance, grades), ALWAYS refer to the provided tool output. 
            2. ANTI-HALLUCINATION: NEVER make up numbers or platform data. If tools return no data, explain that you couldn't find the information.
            3. AGENTIC REASONING: Combine tool data with your native intelligence to provide strategic insights.
            4. STRUCTURED ONLY: You MUST return valid JSON following the CONTRACT.
            
            CONTRACT:
            {
              "type": "mixed",
              "blocks": [
                { "type": "text", "content": "..." },
                { "type": "table", "headers": ["Label", "Value"], "rows": [["Item", "100"]] },
                { "type": "chart", "chartType": "line", "data": [{"name": "Jan", "value": 10}] }
              ],
              "meta": { "intent": "...", "confidence": 0.98, "model_routing": "high_reasoning" }
            }
            
            FORMATTING RULES:
            - Use :::info, :::warning, :::success in text blocks for emphasis.
            - Tables are preferred for multi-item comparisons.
            - Charts are mandatory for trends, growth, or distribution data.
            - No markdown outside of text blocks.
            """;
    }

    private String detectIntent(String query) {
        String q = query.toLowerCase();
        if (q.contains("compare") || q.contains("vs") || q.contains("difference")) return "comparison";
        if (q.contains("trend") || q.contains("growth") || q.contains("chart") || q.contains("data") || q.contains("stats")) return "analysis";
        if (q.contains("code") || q.contains("script") || q.contains("api") || q.contains("example") || q.contains("query")) return "code";
        if (q.contains("how to") || q.contains("steps") || q.contains("process") || q.contains("explain")) return "explanation";
        return "general_operations";
    }

    private String selectModel(String intent) {
        // Step 10: Model Routing Strategy
        return switch (intent) {
            case "analysis" -> "gemini-2.0-pro-experimental"; // High reasoning for data
            case "code" -> "gemini-2.0-flash-code"; // Specialized code model
            default -> "gemini-2.0-flash"; // Fast model for general queries
        };
    }

    private String planResponse(String intent) {
        return switch (intent) {
            case "comparison" -> "Synthesize tool data into a comparative table and provide strategic takeaways.";
            case "analysis" -> "Project trends using available data tools and visualize with a chart block.";
            case "code" -> "Draft a precise implementation or query example based on platform schemas.";
            case "explanation" -> "Explain the operational workflow or concept with clear procedural blocks.";
            default -> "Execute requested operation and summarize results with high fidelity.";
        };
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
            log.warn("JSON parse failed, returning as text block", ex);
            ObjectNode fallback = objectMapper.createObjectNode();
            fallback.put("type", "mixed");
            ArrayNode blocks = fallback.putArray("blocks");
            blocks.addObject().put("type", "text").put("content", raw);
            return fallback;
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
