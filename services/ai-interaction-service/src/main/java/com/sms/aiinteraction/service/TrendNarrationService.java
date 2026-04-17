package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.stereotype.Service;

@Service
public class TrendNarrationService {
    private final AiInteractionProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    public TrendNarrationService(AiInteractionProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public String summarizeEnrollmentTrend(String question, JsonNode trendData) {
        String fallback = fallbackSummary(trendData);

        String provider = properties.llm() == null ? "" : (properties.llm().provider() == null ? "" : properties.llm().provider());
        if (provider.isBlank()) return fallback;

        try {
            if ("OPENAI".equalsIgnoreCase(provider)) {
                return summarizeWithOpenAi(question, trendData, fallback);
            }
            if ("OLLAMA".equalsIgnoreCase(provider)) {
                return summarizeWithOllama(question, trendData, fallback);
            }
            ObjectNode requestBody = objectMapper.createObjectNode();
            return fallback;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return fallback;
        } catch (IOException ex) {
            return fallback;
        }
    }

    private String summarizeWithOllama(String question, JsonNode trendData, String fallback) throws IOException, InterruptedException {
        if (properties.llm().ollamaBaseUrl() == null || properties.llm().ollamaBaseUrl().isBlank()) return fallback;
        if (properties.llm().ollamaModel() == null || properties.llm().ollamaModel().isBlank()) return fallback;

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", properties.llm().ollamaModel());
        requestBody.put("stream", false);
        requestBody.put("temperature", 0.4);

        ObjectNode options = requestBody.putObject("options");
        options.put("num_predict", 450);
        options.put("top_p", 0.9);

        var messages = requestBody.putArray("messages");
        messages.addObject()
                .put("role", "system")
                .put("content",
                        "You are an analytics assistant inside a school platform. "
                                + "Write a concise markdown summary with bullet points. "
                                + "Do NOT invent numbers; use only the provided JSON.");
        messages.addObject()
                .put("role", "user")
                .put("content",
                        "Question: " + safe(question) + "\n\n"
                                + "Trend JSON:\n" + objectMapper.writeValueAsString(trendData));

        String base = properties.llm().ollamaBaseUrl().replaceAll("/+$", "");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(base + "/api/chat"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return fallback;
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("message").path("content").asText("");
        if (content == null || content.isBlank()) return fallback;
        return content.trim();
    }

    private String summarizeWithOpenAi(String question, JsonNode trendData, String fallback) throws IOException, InterruptedException {
        if (properties.llm().openaiApiKey() == null || properties.llm().openaiApiKey().isBlank()) return fallback;
        String model = properties.llm().openaiModel() == null || properties.llm().openaiModel().isBlank()
                ? "gpt-4o-mini"
                : properties.llm().openaiModel().trim();

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", 450);
        body.put("temperature", 0.4);
        var messages = body.putArray("messages");
        messages.addObject().put("role", "system").put("content",
                "You are an analytics assistant inside a school platform. "
                        + "Write a concise markdown summary with bullet points. "
                        + "Do NOT invent numbers; use only the provided JSON.");
        messages.addObject().put("role", "user").put("content",
                "Question: " + safe(question) + "\n\nTrend JSON:\n" + objectMapper.writeValueAsString(trendData));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .timeout(Duration.ofSeconds(25))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + properties.llm().openaiApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) return fallback;
        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        if (content == null || content.isBlank()) return fallback;
        return content.trim();
    }

    private String fallbackSummary(JsonNode trendData) {
        if (trendData == null || trendData.isNull()) {
            return "I couldn't compute an enrollment trend right now.";
        }
        String total = trendData.path("totalAdmissions").asText("");
        String thisMonth = trendData.path("thisMonthAdmissions").asText("");
        String avg = trendData.path("avgAdmissionsPerMonth").asText("");
        return """
                **Enrollment trend**
                - Total admissions (period): %s
                - Admissions this month: %s
                - Average per month: %s
                """.formatted(emptyToDash(total), emptyToDash(thisMonth), emptyToDash(avg)).trim();
    }

    private String safe(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        if (trimmed.length() > 500) return trimmed.substring(0, 500);
        return trimmed;
    }

    private String emptyToDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
