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

    public JsonNode infer(String userQuery, UserContext userContext, ObjectNode toolResults) {
        String provider = properties.llm().provider();
        if ("OLLAMA".equalsIgnoreCase(provider)) {
            return inferWithOllama(userQuery, userContext, toolResults);
        }
        // Fallback to a basic structured wrapper if LLM is unavailable
        return basicStructuredResponse(toolResults);
    }

    private JsonNode inferWithOllama(String userQuery, UserContext userContext, ObjectNode toolResults) {
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

            String base = properties.llm().ollamaBaseUrl().replaceAll("/+$", "");
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
            // Log error
        }
        return basicStructuredResponse(toolResults);
    }

    private String getSystemPrompt() {
        return """
            You are the AI Operating Layer inside a modern Student Management System (SMS).
            Role: School Administrator, Success Coach, Data Analyst, and Product Designer.
            
            STRICT PROTOCOL:
            1. Return ONLY valid JSON.
            2. Never use plain text when a rich component exists.
            3. HIDE raw tool data; synthesize it into Elite UI nodes.
            
            SMART UI DECISION RULES:
            - STUDENT LOOKUP: Use profile_panel, quick stats, attendance %.
            - ATTENDANCE: Use table, heatmap, trend line, absentee alerts.
            - FEES/FINANCE: Use kpi_card, due list table, overdue alerts.
            - EXAMS/MARKS: Use rank table, subject comparison charts, topper cards.
            - TIMETABLE: Use calendar, weekly grid, teacher slot cards.
            - PLANNING: Use timeline, kanban, milestones.
            - TRANSPORT: Use route cards, bus occupancy tables.
            
            UI COMPONENT LEXICON:
            - kpi_card: { "type": "kpi_card", "title": "...", "value": "...", "subtitle": "..." }
            - table: { "type": "table", "title": "...", "columns": [...], "rows": [...] }
            - chart_bar / chart_line: { "type": "chart_bar", "title": "...", "labels": [...], "series": [...] }
            - profile_panel: { "name": "...", "meta": {...}, "stats": [...] }
            - timeline: { "items": [{ "date": "...", "title": "...", "description": "..." }] }
            - kanban: { "columns": [{ "title": "...", "items": [...] }] }
            - alert_banner: { "severity": "low|medium|high", "message": "..." }
            
            OUTPUT SCHEMA:
            {
              "intent": "string",
              "title": "string",
              "view": "mixed_dashboard | profile | analytics",
              "summary": "high-level summary",
              "components": [...],
              "insights": [...],
              "actions": [ { "label": "Text", "action": "id" } ]
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

    private JsonNode basicStructuredResponse(ObjectNode toolResults) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("intent", "multi_data_view");
        root.put("title", "Aggregated Service Results");
        root.put("view", "light");
        root.put("summary", "Automated view generated for multiple data sources.");
        ArrayNode components = root.putArray("components");
        
        toolResults.fields().forEachRemaining(entry -> {
            ObjectNode table = components.addObject();
            table.put("type", "table");
            table.put("title", "Source: " + entry.getKey());
            table.set("data", entry.getValue());
        });
        
        return root;
    }
}
