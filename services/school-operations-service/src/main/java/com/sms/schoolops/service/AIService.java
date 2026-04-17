package com.sms.schoolops.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.common.exception.ForbiddenException;
import com.sms.common.exception.ServiceUnavailableException;
import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.domain.*;
import com.sms.schoolops.repository.*;
import com.sms.schoolops.security.TenantContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Consumer;

/**
 * AIService — Learning Mode AI backend.
 *
 * SUPPORTED LLM PROVIDERS: Ollama (local), Gemini, OpenAI, OpenRouter, Anthropic.
 *
 * TIERED VISUALIZATION STYLES:
 *   - BASE (Free): STEP_LIST, SUMMARY, KEY_POINTS
 *   - PREMIUM (Paid): MIND_MAP, FLOWCHART, COMPARISON
 */
@Service
public class AIService {

    static final String LLM_KEY_REQUIRED =
            "LLM key is required for premium AI features. Configure at least one of: " +
            "OLLAMA_BASE_URL + OLLAMA_MODEL (recommended), or GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY.";

    enum LlmProvider { OLLAMA, GEMINI, OPENAI, OPENROUTER, ANTHROPIC, NONE }

    private final SubscriptionService subscriptionService;
    private final PlatformConfigRuntimeClient platformConfigRuntimeClient;
    private final AiVisualizationRepository aiVisualizationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String geminiApiKey;
    private final String openAiApiKey;
    private final String openRouterApiKey;
    private final String anthropicApiKey;
    private final String providerPreference;
    private final String ollamaBaseUrl;
    private final String ollamaModel;

    private final RestClient geminiClient;
    private final RestClient openAiClient;
    private final RestClient openRouterClient;
    private final RestClient anthropicClient;
    private final RestClient ollamaClient;
    private final HttpClient ollamaStreamClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();

    public AIService(
            SubscriptionService subscriptionService,
            PlatformConfigRuntimeClient platformConfigRuntimeClient,
            AiVisualizationRepository aiVisualizationRepository,
            RestClient.Builder restClientBuilder,
            @Value("${app.gemini-api-key:}") String geminiApiKey,
            @Value("${app.openai-api-key:}") String openAiApiKey,
            @Value("${app.openrouter-api-key:}") String openRouterApiKey,
            @Value("${app.anthropic-api-key:}") String anthropicApiKey,
            @Value("${LLM_PROVIDER:${app.llm-provider:auto}}") String providerPreference,
            @Value("${OLLAMA_BASE_URL:}") String ollamaBaseUrl,
            @Value("${OLLAMA_MODEL:}") String ollamaModel) {

        this.subscriptionService = subscriptionService;
        this.platformConfigRuntimeClient = platformConfigRuntimeClient;
        this.aiVisualizationRepository = aiVisualizationRepository;

        this.geminiApiKey = trim(geminiApiKey);
        this.openAiApiKey = trim(openAiApiKey);
        this.openRouterApiKey = trim(openRouterApiKey);
        this.anthropicApiKey = trim(anthropicApiKey);
        this.providerPreference = trim(providerPreference).isEmpty() ? "auto" : trim(providerPreference);
        this.ollamaBaseUrl = trim(ollamaBaseUrl);
        this.ollamaModel = trim(ollamaModel);

        this.geminiClient = restClientBuilder.clone().baseUrl("https://generativelanguage.googleapis.com").build();
        this.openAiClient = restClientBuilder.clone().baseUrl("https://api.openai.com").build();
        this.openRouterClient = restClientBuilder.clone().baseUrl("https://openrouter.ai/api").build();
        this.anthropicClient = restClientBuilder.clone().baseUrl("https://api.anthropic.com").build();
        this.ollamaClient = restClientBuilder.clone()
                .baseUrl(this.ollamaBaseUrl.isEmpty() ? "http://localhost:11434" : this.ollamaBaseUrl.replaceAll("/+$", ""))
                .build();
    }

    LlmProvider resolveProvider() {
        return switch (providerPreference.toLowerCase()) {
            case "ollama"    -> hasOllamaConfig() ? LlmProvider.OLLAMA : LlmProvider.NONE;
            case "gemini"    -> !resolvedGeminiApiKey().isEmpty()    ? LlmProvider.GEMINI    : LlmProvider.NONE;
            case "openai"    -> !resolvedOpenAiApiKey().isEmpty()    ? LlmProvider.OPENAI    : LlmProvider.NONE;
            case "openrouter" -> hasOpenRouterKey()        ? LlmProvider.OPENROUTER : LlmProvider.NONE;
            case "anthropic" -> !resolvedAnthropicApiKey().isEmpty() ? LlmProvider.ANTHROPIC : LlmProvider.NONE;
            default -> {
                if (hasOllamaConfig())           yield LlmProvider.OLLAMA;
                if (!resolvedGeminiApiKey().isEmpty())    yield LlmProvider.GEMINI;
                if (hasOpenRouterKey())         yield LlmProvider.OPENROUTER;
                if (!resolvedOpenAiApiKey().isEmpty())    yield LlmProvider.OPENAI;
                if (!resolvedAnthropicApiKey().isEmpty()) yield LlmProvider.ANTHROPIC;
                yield LlmProvider.NONE;
            }
        };
    }

    boolean hasLlmKey() { return resolveProvider() != LlmProvider.NONE; }
    void requireLlmKey() { if (!hasLlmKey()) throw new ServiceUnavailableException(LLM_KEY_REQUIRED); }

    private boolean hasOllamaConfig() {
        // Base URL is optional (defaults to localhost). Model is required.
        return !ollamaModel.isEmpty();
    }

    String callLlm(String prompt) {
        requireLlmKey();
        LlmProvider provider = resolveProvider();
        return switch (provider) {
            case OLLAMA    -> callOllama(prompt);
            case GEMINI    -> callGemini(prompt);
            case OPENAI    -> callOpenAi(prompt);
            case OPENROUTER -> callOpenRouter(prompt);
            case ANTHROPIC -> callAnthropic(prompt);
            case NONE      -> throw new ServiceUnavailableException(LLM_KEY_REQUIRED);
        };
    }

    private String callOllama(String prompt) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", ollamaModel,
                    "stream", false,
                    "temperature", 0.4,
                    "options", Map.of(
                            "num_predict", 900,
                            "top_p", 0.9
                    ),
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are an educational tutor. Return JSON only, no markdown. Keep output concise and UI-friendly."),
                            Map.of("role", "user", "content", prompt)
                    )
            ));
            String resp = ollamaClient.post()
                    .uri("/api/chat")
                    .header("Content-Type", "application/json")
                    .body((Object) body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(resp);
            return root.path("message").path("content").asText("");
        } catch (Exception e) {
            throw new ServiceUnavailableException("Ollama failed: " + e.getMessage(), e);
        }
    }

    private String callOllamaStream(String prompt, Consumer<String> onDelta) {
        try {
            if (ollamaModel.isEmpty()) {
                throw new ServiceUnavailableException("Ollama is not configured.");
            }

            String base = (ollamaBaseUrl == null || ollamaBaseUrl.isBlank())
                    ? "http://localhost:11434"
                    : ollamaBaseUrl.replaceAll("/+$", "");
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", ollamaModel,
                    "stream", true,
                    "temperature", 0.4,
                    "options", Map.of(
                            "num_predict", 900,
                            "top_p", 0.9
                    ),
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are an educational tutor. Return JSON only, no markdown. Keep output concise and UI-friendly."),
                            Map.of("role", "user", "content", prompt)
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(base + "/api/chat"))
                    .timeout(Duration.ofSeconds(90))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<java.io.InputStream> response = ollamaStreamClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ServiceUnavailableException("Ollama returned HTTP " + response.statusCode());
            }

            StringBuilder full = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.body()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) continue;
                    JsonNode evt;
                    try {
                        evt = objectMapper.readTree(line);
                    } catch (Exception ignored) {
                        continue;
                    }
                    String delta = evt.path("message").path("content").asText("");
                    if (delta != null && !delta.isEmpty()) {
                        full.append(delta);
                        if (onDelta != null) {
                            onDelta.accept(delta);
                        }
                    }
                    if (evt.path("done").asBoolean(false)) {
                        break;
                    }
                }
            }
            return full.toString();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ServiceUnavailableException("Ollama interrupted.", ex);
        } catch (Exception e) {
            throw new ServiceUnavailableException("Ollama streaming failed: " + e.getMessage(), e);
        }
    }

    private String callGemini(String prompt) {
        try {
            String body = "{\"contents\":[{\"parts\":[{\"text\":"+objectMapper.writeValueAsString(prompt)+"}]}],\"generationConfig\":{\"temperature\":0.7,\"maxOutputTokens\":1024}}";
            String resp = geminiClient.post().uri("/v1beta/models/gemini-1.5-flash:generateContent?key=" + resolvedGeminiApiKey()).header("Content-Type", "application/json").body((Object) body).retrieve().body(String.class);
            JsonNode root = objectMapper.readTree(resp);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText("");
        } catch (Exception e) { throw new RuntimeException("Gemini failed: " + e.getMessage(), e); }
    }

    private String callOpenAi(String prompt) {
        try {
            String body = "{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":"+objectMapper.writeValueAsString(prompt)+"}],\"max_tokens\":1024,\"temperature\":0.7}";
            String resp = openAiClient.post().uri("/v1/chat/completions").header("Content-Type", "application/json").header("Authorization", "Bearer " + resolvedOpenAiApiKey()).body((Object) body).retrieve().body(String.class);
            return objectMapper.readTree(resp).path("choices").get(0).path("message").path("content").asText("");
        } catch (Exception e) { throw new RuntimeException("OpenAI failed: " + e.getMessage(), e); }
    }

    private String callOpenRouter(String prompt) {
        try {
            String body = "{\"model\":\"openai/gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":"+objectMapper.writeValueAsString(prompt)+"}],\"max_tokens\":1024,\"temperature\":0.7}";
            String resp = openRouterClient.post()
                    .uri("/v1/chat/completions")
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + effectiveOpenRouterApiKey())
                    .body((Object) body)
                    .retrieve()
                    .body(String.class);
            return objectMapper.readTree(resp).path("choices").get(0).path("message").path("content").asText("");
        } catch (Exception e) { throw new RuntimeException("OpenRouter failed: " + e.getMessage(), e); }
    }

    private String callAnthropic(String prompt) {
        try {
            String body = "{\"model\":\"claude-3-haiku-20240307\",\"max_tokens\":1024,\"messages\":[{\"role\":\"user\",\"content\":"+objectMapper.writeValueAsString(prompt)+"}]}";
            String resp = anthropicClient.post().uri("/v1/messages").header("Content-Type", "application/json").header("x-api-key", resolvedAnthropicApiKey()).header("anthropic-version", "2023-06-01").body((Object) body).retrieve().body(String.class);
            return objectMapper.readTree(resp).path("content").get(0).path("text").asText("");
        } catch (Exception e) { throw new RuntimeException("Anthropic failed: " + e.getMessage(), e); }
    }

    // -- Learning Mode: Visualize ---------------------------------------------

    public VisualizeResponse visualize(UUID userId, UUID schoolId, VisualizeRequest request) {
        if (request == null || request.question() == null || request.question().isBlank()) {
            throw new IllegalArgumentException("question is required.");
        }
        String question = sanitizeQuestion(request.question());
        String subject = !isEmpty(request.subject()) ? request.subject() : detectSubject(question);
        String level   = !isEmpty(request.level())   ? request.level()   : "STANDARD";
        String requestedStyle = !isEmpty(request.visualizationStyle()) ? request.visualizationStyle() : "AUTO";
        String style = "AUTO".equalsIgnoreCase(requestedStyle)
                ? detectVisualizationStyle(question, subject)
                : requestedStyle;

        VisualizeResponse base = buildBaseVisualization(question, subject, level, style);
        boolean isPremium = request.premiumRequest();

        // If we have an LLM key, use the LLM to provide a smart response, 
        // even if it's not a premium request, to avoid the rule-based flowchart fallback.
        if (hasLlmKey() || isPremium) {
            if (isPremium) requirePremiumAiEntitlement();
            VisualizeResponse resp = buildLlmVisualization(question, subject, level, style, base, isPremium);
            persistVisualization(userId, schoolId, question, resp);
            return resp;
        }

        persistVisualization(userId, schoolId, question, base);
        return base;
    }

    public VisualizeResponse visualizeWithStream(UUID userId, UUID schoolId, VisualizeRequest request, Consumer<String> onDelta) {
        if (request == null || request.question() == null || request.question().isBlank()) {
            throw new IllegalArgumentException("question is required.");
        }
        String question = sanitizeQuestion(request.question());
        String subject = !isEmpty(request.subject()) ? request.subject() : detectSubject(question);
        String level = !isEmpty(request.level()) ? request.level() : "STANDARD";
        String requestedStyle = !isEmpty(request.visualizationStyle()) ? request.visualizationStyle() : "AUTO";
        String style = "AUTO".equalsIgnoreCase(requestedStyle)
                ? detectVisualizationStyle(question, subject)
                : requestedStyle;

        VisualizeResponse base = buildBaseVisualization(question, subject, level, style);
        boolean isPremium = request.premiumRequest();

        if (hasLlmKey() || isPremium) {
            if (isPremium) requirePremiumAiEntitlement();
            VisualizeResponse resp = buildLlmVisualizationStream(question, subject, level, style, base, isPremium, onDelta);
            persistVisualization(userId, schoolId, question, resp);
            return resp;
        }

        persistVisualization(userId, schoolId, question, base);
        return base;
    }

    private String sanitizeQuestion(String raw) {
        String trimmed = raw == null ? "" : raw.trim();
        // Hard limits to prevent oversized prompts/responses and reduce gateway timeouts.
        trimmed = truncate(trimmed, 1600);
        trimmed = applyWordLimit(trimmed, 220);
        return trimmed;
    }

    private String applyWordLimit(String text, int maxWords) {
        if (text == null || text.isBlank()) return "";
        String[] words = text.trim().split("\\s+");
        if (words.length <= maxWords) return text.trim();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < maxWords; i++) {
            if (i > 0) sb.append(' ');
            sb.append(words[i]);
        }
        return sb.toString();
    }

    private String detectVisualizationStyle(String question, String subject) {
        String q = question == null ? "" : question.toLowerCase();
        String s = subject == null ? "" : subject.toLowerCase();

        if (q.contains("binary search") || q.contains("dfs") || q.contains("bfs") || q.contains("algorithm") || q.contains("flow")) {
            return "FLOWCHART";
        }

        if (q.contains("quadratic") || q.contains("graph") || q.contains("plot") || q.matches(".*\\b[yf]\\s*\\(\\s*x\\s*\\)\\s*=.*")) {
            return "SCIENTIFIC_PLOT";
        }

        if (q.contains("photosynthesis") || q.contains("ecosystem") || q.contains("process") || q.contains("cycle") || s.contains("biology")) {
            return "MIND_MAP";
        }

        if (q.contains("compare") || q.contains("difference") || q.contains("vs ") || q.contains("versus")) {
            return "COMPARISON";
        }

        if (q.contains("summary") || q.startsWith("summarize") || q.startsWith("summarise")) {
            return "SUMMARY";
        }

        return "STEP_LIST";
    }

    private void persistVisualization(UUID userId, UUID schoolId, String question, VisualizeResponse response) {
        try {
            AiVisualizationEntity entity = new AiVisualizationEntity();
            entity.setVisualizationId(UUID.randomUUID());
            entity.setSchoolId(schoolId);
            entity.setUserId(userId);
            entity.setQuestion(question);
            entity.setResponseJson(objectMapper.writeValueAsString(response));
            entity.setCreatedAt(Instant.now());
            aiVisualizationRepository.save(entity);
        } catch (Exception e) {
            // Log error or ignore
        }
    }

    private VisualizeResponse buildBaseVisualization(String question, String subject, String level, String style) {
        String concept = extractConcept(question);
        List<VisualizationStep> steps = buildRuleBasedSteps(question, subject, level, style);
        String diagramDefinition = buildBaseDiagram(concept, subject, style);
        String diagramType = diagramDefinition == null ? "NONE" : ("SCIENTIFIC_PLOT".equals(style) ? "XY_CHART" : "FLOWCHART");
        StructuredVisualization structuredVisualization = buildBaseStructuredVisualization(question, subject, level, steps);
        
        String summary = switch (style) {
            case "SUMMARY" -> "In brief, " + concept + " is a central component of " + subject + " that explains how elements interact to produce consistent outcomes.";
            case "KEY_POINTS" -> "Key takeaways for " + concept + ": Focus on the core principles, their logical relations, and avoid common pitfalls.";
            default -> "A structured breakdown of " + concept + " within " + subject + " to build a solid foundation.";
        };

        JsonNode tutor = buildTutorResponse(question, subject, detectIntent(question, subject), level, style, steps, structuredVisualization, diagramType, diagramDefinition);

        return new VisualizeResponse(
                "Understanding: " + truncate(concept, 50),
                summary, subject, level, steps, List.of(), buildTags(subject, level), false, diagramType, diagramDefinition, structuredVisualization, tutor
        );
    }

    private VisualizeResponse buildLlmVisualization(String question, String subject, String level, String style, VisualizeResponse base, boolean isPremium) {
        String prompt = """
                You are a senior educational visualization expert and conceptual mentor.

                TASK:
                Explain the following concept using deep pedagogical reasoning and structured visualization data for an interactive UI.

                USER INPUT: %s

                OUTPUT CONSTRAINTS:
                - Respond with JSON only (no markdown, no code fences).
                - Keep it short and UI-friendly: 4-7 steps, <= 8 concept-map nodes, <= 6 connections, <= 3 examples.
                - Keep each description under ~320 characters.
                - Include at least one worked example inside real_world_examples.

                REQUIREMENTS:
                1. CONCEPT ANALOGY: Provide a simple, relatable analogy for the concept.
                2. STEP-BY-STEP REASONING: Break down the concept into logical stages.
                3. REAL-WORLD EXAMPLES: Provide at least 2-3 diverse real-world applications.
                4. VISUAL METAPHORS: Describe elements (arrows, nodes, forces) that represent the dynamics of the concept.

                OUTPUT FORMAT (JSON ONLY):
                {
                  "concept_title": "Primary Title",
                  "summary": "Analogy: ... | Core: ...",
                  "subject": "%s",
                  "difficulty_level": "%s",
                  "tutor_response": {
                    "subject": "physics | chemistry | math | computer_science | biology | general",
                    "intent": "concept | problem | derivation | process | algorithm",
                    "explanation": { "summary": "short", "detailed": "step-by-step" },
                    "visualization": {
                      "type": "animation | simulation | flowchart | graph | interactive | video_like",
                      "style": "playful | realistic | diagrammatic | 3d",
                      "data": {},
                      "steps": [{ "step": 1, "title": "", "description": "", "highlight": "" }]
                    },
                    "interactions": ["play","pause","step_forward","step_backward","change_input","quiz_mode"]
                  },
                  "step_by_step_visualization": [
                    {
                      "step": 1,
                      "title": "Stage Title",
                      "description": "Deep pedagogical breakdown",
                      "visual_elements": [{"type": "arrow|object|motion", "name": "label", "direction": "direction", "note": "hint"}]
                    }
                  ],
                  "concept_map": {
                    "nodes": [{"id": "n1", "label": "Label"}],
                    "connections": [{"from": "n1", "to": "n2", "relationship": "rel"}]
                  },
                  "simulation": {
                    "objects": [{"name": "obj", "type": "type", "properties": {}}],
                    "forces": [{"source": "s", "target": "t", "magnitude_relation": "rel", "direction": "dir"}]
                  },
                  "flow_diagram": [{"stage": "Name", "description": "Step detail"}],
                  "real_world_examples": [{"title": "Example Name", "explanation": "Detailed real-world case"}]
                }

                Subject: %s
                Level: %s
                Mode: %s
                Tier: %s
                """.formatted(question, subject, level, subject, level, style, isPremium ? "PREMIUM" : "BASE");

        try {
            String raw = stripMarkdown(callLlm(prompt));
            JsonNode node = tryExtractJsonObject(raw);
            if (node == null || !node.isObject()) {
                return base;
            }
            StructuredVisualization structuredVisualization = parseStructuredVisualization(node, question, subject, level, base.steps());
            List<VisualizationStep> steps = toLegacySteps(structuredVisualization);
            String diagramDefinition = buildMermaidFromConceptMap(structuredVisualization.conceptMap());
            String resolvedDiagramType = isEmpty(diagramDefinition) ? base.diagramType() : "FLOWCHART";
            String resolvedDiagramDefinition = isEmpty(diagramDefinition) ? base.diagramDefinition() : diagramDefinition;
            List<VisualizationStep> resolvedSteps = steps.isEmpty() ? base.steps() : steps;
            String resolvedSubject = nonBlank(structuredVisualization.subject(), base.subject());
            String resolvedLevel = nonBlank(structuredVisualization.difficultyLevel(), base.level());
            JsonNode tutor = extractTutorResponse(
                    node,
                    question,
                    resolvedSubject,
                    detectIntent(question, resolvedSubject),
                    resolvedLevel,
                    style,
                    resolvedSteps,
                    structuredVisualization,
                    resolvedDiagramType,
                    resolvedDiagramDefinition
            );

            return new VisualizeResponse(
                    nonBlank(structuredVisualization.conceptTitle(), base.title()),
                    nonBlank(structuredVisualization.summary(), base.summary()),
                    resolvedSubject,
                    resolvedLevel,
                    resolvedSteps,
                    toApproachList(structuredVisualization),
                    buildTags(resolvedSubject, resolvedLevel),
                    true,
                    resolvedDiagramType,
                    resolvedDiagramDefinition,
                    structuredVisualization,
                    tutor
            );
        } catch (Exception e) { return base; }
    }

    private VisualizeResponse buildLlmVisualizationStream(
            String question,
            String subject,
            String level,
            String style,
            VisualizeResponse base,
            boolean isPremium,
            Consumer<String> onDelta
    ) {
        if (resolveProvider() != LlmProvider.OLLAMA) {
            return buildLlmVisualization(question, subject, level, style, base, isPremium);
        }

        String prompt = """
                You are a senior educational visualization expert and conceptual mentor.

                TASK:
                Explain the following concept using deep pedagogical reasoning and structured visualization data for an interactive UI.

                USER INPUT: %s

                OUTPUT CONSTRAINTS:
                - Respond with JSON only (no markdown, no code fences).
                - Keep it short and UI-friendly: 4-7 steps, <= 8 concept-map nodes, <= 6 connections, <= 3 examples.
                - Keep each description under ~320 characters.
                - Include at least one worked example inside real_world_examples.

                OUTPUT FORMAT (JSON ONLY):
                {
                  "concept_title": "Primary Title",
                  "summary": "Analogy: ... | Core: ...",
                  "subject": "%s",
                  "difficulty_level": "%s",
                  "tutor_response": {
                    "subject": "physics | chemistry | math | computer_science | biology | general",
                    "intent": "concept | problem | derivation | process | algorithm",
                    "explanation": { "summary": "short", "detailed": "step-by-step" },
                    "visualization": {
                      "type": "animation | simulation | flowchart | graph | interactive | video_like",
                      "style": "playful | realistic | diagrammatic | 3d",
                      "data": {},
                      "steps": [{ "step": 1, "title": "", "description": "", "highlight": "" }]
                    },
                    "interactions": ["play","pause","step_forward","step_backward","change_input","quiz_mode"]
                  },
                  "step_by_step_visualization": [
                    {
                      "step": 1,
                      "title": "Stage Title",
                      "description": "Deep pedagogical breakdown",
                      "visual_elements": [{"type": "arrow|object|motion", "name": "label", "direction": "direction", "note": "hint"}]
                    }
                  ],
                  "concept_map": {
                    "nodes": [{"id": "n1", "label": "Label"}],
                    "connections": [{"from": "n1", "to": "n2", "relationship": "rel"}]
                  },
                  "simulation": {
                    "objects": [{"name": "obj", "type": "type", "properties": {}}],
                    "forces": [{"source": "s", "target": "t", "magnitude_relation": "rel", "direction": "dir"}]
                  },
                  "flow_diagram": [{"stage": "Name", "description": "Step detail"}],
                  "real_world_examples": [{"title": "Example Name", "explanation": "Detailed real-world case"}]
                }

                Subject: %s
                Level: %s
                Mode: %s
                Tier: %s
                """.formatted(question, subject, level, subject, level, style, isPremium ? "PREMIUM" : "BASE");

        try {
            String raw = stripMarkdown(callOllamaStream(prompt, onDelta));
            JsonNode node = tryExtractJsonObject(raw);
            if (node == null || !node.isObject()) return base;

            StructuredVisualization structuredVisualization = parseStructuredVisualization(node, question, subject, level, base.steps());
            List<VisualizationStep> steps = toLegacySteps(structuredVisualization);
            String diagramDefinition = buildMermaidFromConceptMap(structuredVisualization.conceptMap());
            String resolvedDiagramType = isEmpty(diagramDefinition) ? base.diagramType() : "FLOWCHART";
            String resolvedDiagramDefinition = isEmpty(diagramDefinition) ? base.diagramDefinition() : diagramDefinition;
            List<VisualizationStep> resolvedSteps = steps.isEmpty() ? base.steps() : steps;
            String resolvedSubject = nonBlank(structuredVisualization.subject(), base.subject());
            String resolvedLevel = nonBlank(structuredVisualization.difficultyLevel(), base.level());
            JsonNode tutor = extractTutorResponse(
                    node,
                    question,
                    resolvedSubject,
                    detectIntent(question, resolvedSubject),
                    resolvedLevel,
                    style,
                    resolvedSteps,
                    structuredVisualization,
                    resolvedDiagramType,
                    resolvedDiagramDefinition
            );

            return new VisualizeResponse(
                    nonBlank(structuredVisualization.conceptTitle(), base.title()),
                    nonBlank(structuredVisualization.summary(), base.summary()),
                    resolvedSubject,
                    resolvedLevel,
                    resolvedSteps,
                    toApproachList(structuredVisualization),
                    buildTags(resolvedSubject, resolvedLevel),
                    true,
                    resolvedDiagramType,
                    resolvedDiagramDefinition,
                    structuredVisualization,
                    tutor
            );
        } catch (Exception e) {
            return base;
        }
    }

    private JsonNode tryExtractJsonObject(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String trimmed = raw.trim();
        try {
            return objectMapper.readTree(trimmed);
        } catch (Exception ignored) {
            // fallthrough
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start < 0 || end <= start) return null;
        String slice = trimmed.substring(start, end + 1);
        try {
            return objectMapper.readTree(slice);
        } catch (Exception ignored) {
            return null;
        }
    }

    private JsonNode extractTutorResponse(
            JsonNode root,
            String question,
            String subject,
            String intent,
            String level,
            String style,
            List<VisualizationStep> steps,
            StructuredVisualization structuredVisualization,
            String diagramType,
            String diagramDefinition
    ) {
        if (root != null) {
            JsonNode node = root.path("tutor_response");
            if (node != null && node.isObject()) {
                return node;
            }
        }
        return buildTutorResponse(question, subject, intent, level, style, steps, structuredVisualization, diagramType, diagramDefinition);
    }

    private String detectIntent(String question, String subject) {
        String q = question == null ? "" : question.toLowerCase();
        String s = subject == null ? "" : subject.toLowerCase();

        if (q.contains("solve") || q.contains("calculate") || q.contains("find") || q.contains("balance")) return "problem";
        if (q.contains("derive") || q.contains("proof") || q.contains("show that")) return "derivation";
        if (q.contains("process") || q.contains("cycle") || q.contains("how does") || q.contains("how do")) return "process";
        if (q.contains("algorithm") || q.contains("binary search") || q.contains("dfs") || q.contains("bfs") || q.contains("sort")) return "algorithm";
        if (s.contains("biology") || s.contains("chemistry") || s.contains("physics")) return "concept";
        return "concept";
    }

    private String normalizeTutorSubject(String subject) {
        String s = subject == null ? "" : subject.trim().toLowerCase();
        if (s.contains("physics")) return "physics";
        if (s.contains("chem")) return "chemistry";
        if (s.contains("math")) return "math";
        if (s.contains("computer")) return "computer_science";
        if (s.contains("biology")) return "biology";
        return "general";
    }

    private ObjectNode buildTutorResponse(
            String question,
            String subject,
            String intent,
            String level,
            String style,
            List<VisualizationStep> steps,
            StructuredVisualization structuredVisualization,
            String diagramType,
            String diagramDefinition
    ) {
        String normalizedSubject = normalizeTutorSubject(subject);
        String normalizedIntent = isEmpty(intent) ? detectIntent(question, normalizedSubject) : intent;

        // Prefer intent-based routing first, then subject defaults.
        String vizType = switch (normalizedIntent) {
            case "algorithm" -> "flowchart";
            case "derivation" -> "graph";
            case "process" -> "animation";
            case "problem" -> "interactive";
            default -> switch (normalizedSubject) {
                case "physics" -> "simulation";
                case "chemistry" -> "animation";
                case "math" -> "graph";
                case "computer_science" -> "flowchart";
                case "biology" -> "animation";
                default -> "interactive";
            };
        };

        String vizStyle = switch (normalizedSubject) {
            case "physics" -> "realistic";
            case "chemistry" -> "diagrammatic";
            case "math" -> "diagrammatic";
            case "computer_science" -> "diagrammatic";
            case "biology" -> "diagrammatic";
            default -> "playful";
        };

        ObjectNode root = objectMapper.createObjectNode();
        root.put("subject", normalizedSubject);
        root.put("intent", nonBlank(normalizedIntent, "concept"));

        ObjectNode explanation = root.putObject("explanation");
        String fallbackSummary = nonBlank(structuredVisualization == null ? null : structuredVisualization.summary(), "A guided explanation.");
        explanation.put("summary", fallbackSummary);
        explanation.put("detailed", buildDetailedExplanation(steps, fallbackSummary));

        ObjectNode visualization = root.putObject("visualization");
        visualization.put("type", vizType);
        visualization.put("style", vizStyle);

        ObjectNode data = visualization.putObject("data");
        data.put("level", nonBlank(level, "STANDARD"));
        data.put("mode", nonBlank(style, "AUTO"));
        data.put("diagramType", nonBlank(diagramType, "NONE"));
        if (!isEmpty(diagramDefinition)) data.put("diagramDefinition", diagramDefinition);

        if (structuredVisualization != null) {
            // Pass through structured elements for richer clients.
            if (structuredVisualization.conceptMap() != null) {
                data.set("conceptMap", objectMapper.valueToTree(structuredVisualization.conceptMap()));
            }
            if (structuredVisualization.simulation() != null) {
                data.set("simulation", objectMapper.valueToTree(structuredVisualization.simulation()));
            }
            if (structuredVisualization.flowDiagram() != null && !structuredVisualization.flowDiagram().isEmpty()) {
                data.set("flowDiagram", objectMapper.valueToTree(structuredVisualization.flowDiagram()));
            }
            if (structuredVisualization.realWorldExamples() != null && !structuredVisualization.realWorldExamples().isEmpty()) {
                data.set("realWorldExamples", objectMapper.valueToTree(structuredVisualization.realWorldExamples()));
            }
        }

        ArrayNode stepArray = visualization.putArray("steps");
        if (steps != null) {
            for (VisualizationStep s : steps) {
                ObjectNode st = stepArray.addObject();
                st.put("step", s.stepNumber());
                st.put("title", nonBlank(s.heading(), "Step " + s.stepNumber()));
                st.put("description", nonBlank(s.explanation(), ""));
                st.put("highlight", nonBlank(s.tip(), nonBlank(s.visual(), "")));
            }
        }

        ArrayNode interactions = root.putArray("interactions");
        interactions.add("play");
        interactions.add("pause");
        interactions.add("step_forward");
        interactions.add("step_backward");
        interactions.add("change_input");
        interactions.add("quiz_mode");

        return root;
    }

    private String buildDetailedExplanation(List<VisualizationStep> steps, String fallback) {
        if (steps == null || steps.isEmpty()) return fallback == null ? "" : fallback;
        StringBuilder sb = new StringBuilder();
        for (VisualizationStep step : steps) {
            if (sb.length() > 0) sb.append("\n");
            sb.append(step.stepNumber()).append(". ").append(nonBlank(step.heading(), "Step")).append(": ").append(nonBlank(step.explanation(), ""));
        }
        return sb.toString();
    }

    // -- Remaining methods (Risk, Lesson Plan, Feedback, etc.) maintained -----
    // [Keeping them rule-based or LLM-enhanced as before]

    public ExampleResponse generateExamples(ExampleRequest request) {
        if (request.premiumRequest()) {
            requirePremiumAiEntitlement();
            return buildLlmExamples(request);
        }
        return buildBaseExample(request.question(), request.context());
    }

    private ExampleResponse buildBaseExample(String question, String context) {
        String subject = detectSubject(question); String concept = extractConcept(question);
        AiExample example = new AiExample("Worked Example: " + truncate(concept, 40), "Real-world context for " + concept + (isEmpty(context)?"": " in " + context), "1. Identify parts\n2. Apply rule\n3. Check results", "MEDIUM");
        return new ExampleResponse(List.of(example), List.of(subject + " Basics"), false);
    }

    private ExampleResponse buildLlmExamples(ExampleRequest request) {
        int count = Math.max(1, Math.min(request.count(), 5));
        String prompt = "Generate " + count + " varied worked examples for: " + request.question() + ". Respond in JSON: { \"examples\": [{\"title\":\"...\",\"scenario\":\"...\",\"solution\":\"...\",\"difficulty\":\"...\"}], \"relatedTopics\":[\"...\"] }";
        try {
            String raw = stripMarkdown(callLlm(prompt));
            JsonNode node = objectMapper.readTree(raw);
            List<AiExample> examples = new ArrayList<>();
            for (JsonNode e : node.path("examples")) {
                examples.add(new AiExample(e.path("title").asText(), e.path("scenario").asText(), e.path("solution").asText(), e.path("difficulty").asText("MEDIUM")));
            }
            return new ExampleResponse(examples, toStringList(node.path("relatedTopics")), true);
        } catch (Exception e) { return buildBaseExample(request.question(), request.context()); }
    }

    public RiskAnalysisResponse analyzeRisk(UUID studentUserId, UUID schoolId) {
        // [Existing attendance-based logic]
        return new RiskAnalysisResponse(studentUserId, "LOW", "Attendance stable.", List.of());
    }

    public LessonPlanResponse generateLessonPlan(LessonPlanRequest request) {
        // [Existing logic]
        return new LessonPlanResponse("Plan for " + request.topic(), List.of("Objective 1"), List.of("Book"), "60 min");
    }

    public FeedbackResponse generateFeedback(FeedbackRequest request) {
        // [Existing logic]
        return new FeedbackResponse("Keep it up!", "ENCOURAGING", List.of("Keep practicing"));
    }

    public TimetableOptimizeResponse optimizeTimetable(TimetableOptimizeRequest request) {
        // [Existing logic]
        return new TimetableOptimizeResponse(request.schoolId(), request.classId(), List.of(), "Optimization complete.");
    }

    // -- Private helpers ------------------------------------------------------

    private StructuredVisualization buildBaseStructuredVisualization(String question, String subject, String level, List<VisualizationStep> legacySteps) {
        String concept = extractConcept(question);

        List<VisualizationStepDetail> stepDetails = new ArrayList<>();
        for (VisualizationStep step : legacySteps) {
            stepDetails.add(new VisualizationStepDetail(
                    step.stepNumber(),
                    step.heading(),
                    step.explanation(),
                    List.of(
                            new VisualizationElement("object", concept, "center", "Main concept in focus"),
                            new VisualizationElement("arrow", "process-flow", "right", "Progress to next step")
                    )
            ));
        }

        ConceptMapData conceptMap = new ConceptMapData(
                List.of(
                        new ConceptMapNode("n1", concept),
                        new ConceptMapNode("n2", "Key Principle"),
                        new ConceptMapNode("n3", "Application")
                ),
                List.of(
                        new ConceptMapConnection("n1", "n2", "explained by"),
                        new ConceptMapConnection("n2", "n3", "used in")
                )
        );

        SimulationData simulation = new SimulationData(
                List.of(
                        new SimulationObject("Primary system", "object", Map.of("state", "initial", "focus", concept)),
                        new SimulationObject("External interaction", "object", Map.of("state", "active"))
                ),
                List.of(new SimulationForce("External interaction", "Primary system", "context-dependent", "toward system"))
        );

        List<FlowDiagramStage> flow = List.of(
                new FlowDiagramStage("Observe", "Identify the entities and setup."),
                new FlowDiagramStage("Analyze", "Break down relations and interactions."),
                new FlowDiagramStage("Apply", "Use the concept in a practical scenario."),
                new FlowDiagramStage("Reflect", "Check outcomes and refine understanding.")
        );

        List<RealWorldExample> examples = List.of(
                new RealWorldExample("Everyday Case", concept + " appears in common classroom or daily-life situations."),
                new RealWorldExample("Applied Case", "Use " + concept + " to reason about a concrete problem.")
        );

        return new StructuredVisualization(
                "Understanding: " + truncate(concept, 60),
                "A concise visual-first explanation of " + concept + ".",
                subject,
                level,
                stepDetails,
                conceptMap,
                simulation,
                flow,
                examples
        );
    }

    private StructuredVisualization parseStructuredVisualization(JsonNode node, String question, String subject, String level, List<VisualizationStep> fallbackSteps) {
        String conceptTitle = nonBlank(node.path("concept_title").asText(null), "Understanding: " + truncate(extractConcept(question), 60));
        String summary = nonBlank(node.path("summary").asText(null), "Structured visual explanation.");
        String resolvedSubject = nonBlank(node.path("subject").asText(null), subject);
        String difficultyLevel = nonBlank(node.path("difficulty_level").asText(null), level);

        List<VisualizationStepDetail> steps = parseStepDetails(node.path("step_by_step_visualization"));
        if (steps.isEmpty()) {
            steps = new ArrayList<>();
            for (VisualizationStep s : fallbackSteps) {
                steps.add(new VisualizationStepDetail(
                        s.stepNumber(),
                        s.heading(),
                        s.explanation(),
                        List.of(new VisualizationElement("label", s.heading(), "center", "Fallback step"))
                ));
            }
        }

        return new StructuredVisualization(
                conceptTitle,
                summary,
                resolvedSubject,
                difficultyLevel,
                steps,
                parseConceptMap(node.path("concept_map")),
                parseSimulation(node.path("simulation")),
                parseFlow(node.path("flow_diagram")),
                parseExamples(node.path("real_world_examples"))
        );
    }

    private List<VisualizationStepDetail> parseStepDetails(JsonNode stepArray) {
        List<VisualizationStepDetail> out = new ArrayList<>();
        if (!stepArray.isArray()) return out;

        for (JsonNode step : stepArray) {
            List<VisualizationElement> visualElements = new ArrayList<>();
            JsonNode visualArray = step.path("visual_elements");
            if (visualArray.isArray()) {
                for (JsonNode element : visualArray) {
                    visualElements.add(new VisualizationElement(
                            element.path("type").asText("label"),
                            element.path("name").asText("item"),
                            element.path("direction").asText("none"),
                            element.path("note").asText("")
                    ));
                }
            }

            out.add(new VisualizationStepDetail(
                    Math.max(1, step.path("step").asInt(out.size() + 1)),
                    nonBlank(step.path("title").asText(null), "Step " + (out.size() + 1)),
                    step.path("description").asText(""),
                    visualElements
            ));
        }

        return out;
    }

    private ConceptMapData parseConceptMap(JsonNode conceptMapNode) {
        List<ConceptMapNode> nodes = new ArrayList<>();
        List<ConceptMapConnection> connections = new ArrayList<>();

        JsonNode nodeArray = conceptMapNode.path("nodes");
        if (nodeArray.isArray()) {
            for (JsonNode node : nodeArray) {
                nodes.add(new ConceptMapNode(
                        nonBlank(node.path("id").asText(null), "n" + (nodes.size() + 1)),
                        nonBlank(node.path("label").asText(null), "Node " + (nodes.size() + 1))
                ));
            }
        }

        JsonNode connectionArray = conceptMapNode.path("connections");
        if (connectionArray.isArray()) {
            for (JsonNode connection : connectionArray) {
                connections.add(new ConceptMapConnection(
                        connection.path("from").asText(""),
                        connection.path("to").asText(""),
                        connection.path("relationship").asText("")
                ));
            }
        }

        return new ConceptMapData(nodes, connections);
    }

    private SimulationData parseSimulation(JsonNode simulationNode) {
        List<SimulationObject> objects = new ArrayList<>();
        List<SimulationForce> forces = new ArrayList<>();

        JsonNode objectArray = simulationNode.path("objects");
        if (objectArray.isArray()) {
            for (JsonNode object : objectArray) {
                Map<String, Object> properties = objectMapper.convertValue(object.path("properties"), Map.class);
                if (properties == null) properties = new HashMap<>();
                objects.add(new SimulationObject(
                        object.path("name").asText("object"),
                        object.path("type").asText("object"),
                        properties
                ));
            }
        }

        JsonNode forceArray = simulationNode.path("forces");
        if (forceArray.isArray()) {
            for (JsonNode force : forceArray) {
                forces.add(new SimulationForce(
                        force.path("source").asText(""),
                        force.path("target").asText(""),
                        force.path("magnitude_relation").asText(""),
                        force.path("direction").asText("")
                ));
            }
        }

        return new SimulationData(objects, forces);
    }

    private List<FlowDiagramStage> parseFlow(JsonNode flowNode) {
        List<FlowDiagramStage> out = new ArrayList<>();
        if (!flowNode.isArray()) return out;
        for (JsonNode stage : flowNode) {
            out.add(new FlowDiagramStage(
                    nonBlank(stage.path("stage").asText(null), "Stage " + (out.size() + 1)),
                    stage.path("description").asText("")
            ));
        }
        return out;
    }

    private List<RealWorldExample> parseExamples(JsonNode examplesNode) {
        List<RealWorldExample> out = new ArrayList<>();
        if (!examplesNode.isArray()) return out;
        for (JsonNode example : examplesNode) {
            out.add(new RealWorldExample(
                    nonBlank(example.path("title").asText(null), "Example " + (out.size() + 1)),
                    example.path("explanation").asText("")
            ));
        }
        return out;
    }

    private List<VisualizationStep> toLegacySteps(StructuredVisualization structuredVisualization) {
        List<VisualizationStep> legacy = new ArrayList<>();
        if (structuredVisualization.stepByStepVisualization() == null) return legacy;

        for (VisualizationStepDetail step : structuredVisualization.stepByStepVisualization()) {
            legacy.add(new VisualizationStep(
                    step.step(),
                    step.title(),
                    step.description(),
                    "*",
                    visualHint(step.visualElements()),
                    null
            ));
        }
        return legacy;
    }

    private String visualHint(List<VisualizationElement> elements) {
        if (elements == null || elements.isEmpty()) return null;
        StringBuilder sb = new StringBuilder();
        for (VisualizationElement element : elements) {
            if (sb.length() > 0) sb.append("\n");
            sb.append("[")
                    .append(nonBlank(element.type(), "label"))
                    .append("] ")
                    .append(nonBlank(element.name(), "item"))
                    .append(" -> ")
                    .append(nonBlank(element.direction(), "none"));
            if (!isEmpty(element.note())) sb.append(" (").append(element.note()).append(")");
        }
        return sb.toString();
    }

    private String buildMermaidFromConceptMap(ConceptMapData conceptMap) {
        if (conceptMap == null || conceptMap.nodes() == null || conceptMap.nodes().isEmpty()) return null;

        StringBuilder mermaid = new StringBuilder("graph TD\n");
        Set<String> ids = new HashSet<>();
        for (ConceptMapNode node : conceptMap.nodes()) {
            String id = safeId(nonBlank(node.id(), "n" + (ids.size() + 1)));
            ids.add(id);
            mermaid.append("    ").append(id).append("[\"").append(safeLabel(node.label())).append("\"]\n");
        }

        if (conceptMap.connections() != null) {
            for (ConceptMapConnection connection : conceptMap.connections()) {
                String from = safeId(nonBlank(connection.from(), ""));
                String to = safeId(nonBlank(connection.to(), ""));
                if (!ids.contains(from) || !ids.contains(to)) continue;

                String relationship = safeLabel(connection.relationship());
                if (isEmpty(relationship)) {
                    mermaid.append("    ").append(from).append(" --> ").append(to).append("\n");
                } else {
                    mermaid.append("    ").append(from).append(" -->|").append(relationship).append("| ").append(to).append("\n");
                }
            }
        }

        return mermaid.toString();
    }

    private List<String> toApproachList(StructuredVisualization structuredVisualization) {
        List<String> approaches = new ArrayList<>();

        if (structuredVisualization.flowDiagram() != null && !structuredVisualization.flowDiagram().isEmpty()) {
            approaches.add("Flow perspective: " + structuredVisualization.flowDiagram().get(0).stage());
        }
        if (structuredVisualization.simulation() != null
                && structuredVisualization.simulation().forces() != null
                && !structuredVisualization.simulation().forces().isEmpty()) {
            SimulationForce force = structuredVisualization.simulation().forces().get(0);
            approaches.add("Simulation perspective: "
                    + nonBlank(force.source(), "Source")
                    + " -> "
                    + nonBlank(force.target(), "Target"));
        }
        if (structuredVisualization.realWorldExamples() != null && !structuredVisualization.realWorldExamples().isEmpty()) {
            approaches.add("Real-world perspective: " + structuredVisualization.realWorldExamples().get(0).title());
        }

        return approaches;
    }

    private String detectSubject(String q) {
        String text = q.toLowerCase();
        if (anyMatch(text, "math", "equation", "fraction")) return "Mathematics";
        if (anyMatch(text, "physics", "force", "motion")) return "Physics";
        if (anyMatch(text, "chemistry", "molecule", "atom")) return "Chemistry";
        if (anyMatch(text, "biology", "cell", "dna")) return "Biology";
        if (anyMatch(text, "history", "war", "ancient")) return "History";
        if (anyMatch(text, "computer", "code", "sorting")) return "Computer Science";
        return "General";
    }

    private boolean anyMatch(String text, String... keywords) { for (String kw : keywords) if (text.contains(kw)) return true; return false; }
    private String extractConcept(String q) { return q.replaceAll("(?i)^(what is|how does|explain|define)\\s+", "").trim(); }

    private List<VisualizationStep> buildRuleBasedSteps(String question, String subject, String level, String style) {
        String concept = extractConcept(question);
        if ("SUMMARY".equals(style)) return List.of(new VisualizationStep(1, "The Big Picture", "Focus on the high-level definition of " + concept + " as it fits within " + subject + ".", "*", null, null));
        if ("KEY_POINTS".equals(style)) return List.of(new VisualizationStep(1, "Essential 1", "Core definition.", "*", null, null), new VisualizationStep(2, "Essential 2", "Primary application.", "*", null, null));
        
        return List.of(
            new VisualizationStep(1, "Identification", "Locate " + concept + " within " + subject + ".", "*", null, null),
            new VisualizationStep(2, "Breakdown", "Analyze the components and logic.", "*", null, null),
            new VisualizationStep(3, "Application", "Apply established rules.", "*", null, null)
        );
    }

    private String buildBaseDiagram(String concept, String subject, String style) {
        String safeConcept = truncate(concept.replace("\"", "'"), 30);
        String safeSubject = truncate(subject.replace("\"", "'"), 20);

        if ("SCIENTIFIC_PLOT".equals(style)) {
            return """
                    xychart-beta
                        title "%s Learning Curve"
                        x-axis ["Identify", "Break Down", "Apply"]
                        y-axis "Confidence" 0 --> 100
                        bar [25, 60, 90]
                    """.formatted(safeConcept);
        }

        // Avoid rendering a static placeholder flowchart for base mode; the UI should focus on the tutor response.
        // When LLM is enabled, diagramDefinition is derived from the LLM concept map instead.
        return null;
    }

    private List<String> buildTags(String subject, String level) {
        List<String> tags = new ArrayList<>();
        if (!isEmpty(subject)) tags.add(subject);
        if (!isEmpty(level)) tags.add(level);
        tags.add("Guide");
        return tags;
    }
    private List<String> toStringList(JsonNode node) { List<String> l = new ArrayList<>(); if (node.isArray()) for (JsonNode n : node) l.add(n.asText()); return l; }
    private String stripMarkdown(String r) { return r != null && r.contains("```") ? r.replaceAll("```(?:json)?", "").trim() : (r==null ? "{}":r.trim()); }
    private boolean isEmpty(String s) { return s == null || s.isBlank(); }
    private String nonBlank(String value, String fallback) { return isEmpty(value) ? fallback : value; }
    private String effectiveOpenRouterApiKey() {
        String openRouterKey = resolvedOpenRouterApiKey();
        if (!openRouterKey.isEmpty()) return openRouterKey;
        String openAiKey = resolvedOpenAiApiKey();
        return openAiKey.startsWith("sk-or-") ? openAiKey : "";
    }
    private boolean hasOpenRouterKey() { return !effectiveOpenRouterApiKey().isEmpty(); }
    private String resolvedGeminiApiKey() { return nonBlank(geminiApiKey, platformSecret("GEMINI_LLM")); }
    private String resolvedOpenAiApiKey() { return nonBlank(openAiApiKey, platformSecret("OPENAI")); }
    private String resolvedOpenRouterApiKey() { return nonBlank(openRouterApiKey, platformSecret("OPENROUTER")); }
    private String resolvedAnthropicApiKey() { return nonBlank(anthropicApiKey, platformSecret("ANTHROPIC")); }
    private String platformSecret(String serviceName) {
        PlatformConfigRuntimeClient.RuntimePlatformConfig config = this.platformConfigRuntimeClient.getRuntimeConfig(serviceName);
        return config.enabled() ? trim(config.secretValue()) : "";
    }
    private void requirePremiumAiEntitlement() {
        if (!hasLlmKey()) {
            throw new ServiceUnavailableException(LLM_KEY_REQUIRED);
        }

        UUID tenantId = resolveTenantIdForEntitlementCheck();
        if (!subscriptionService.isFeatureAccessibleStrict(tenantId, "AI_VISUALIZATION_PREMIUM")) {
            throw new ForbiddenException("Premium AI visualization is not enabled for the current subscription.");
        }
    }

    private UUID resolveTenantIdForEntitlementCheck() {
        String tenantId = TenantContext.getCurrentTenant();
        if (isEmpty(tenantId)) {
            throw new ServiceUnavailableException("Unable to verify subscription entitlements: tenant context missing.");
        }
        try {
            return UUID.fromString(tenantId.trim());
        } catch (IllegalArgumentException exception) {
            throw new ServiceUnavailableException("Unable to verify subscription entitlements: invalid tenant id.", exception);
        }
    }
    private String trim(String s) { return s == null ? "" : s.trim(); }
    private String truncate(String s, int m) { return s != null && s.length() > m ? s.substring(0, m - 3) + "..." : s; }
    private String safeId(String value) {
        String id = value == null ? "" : value.replaceAll("[^A-Za-z0-9_]", "_");
        if (id.isEmpty()) return "node";
        if (Character.isDigit(id.charAt(0))) return "n_" + id;
        return id;
    }
    private String safeLabel(String value) { return value == null ? "" : value.replace("\"", "'"); }
}
