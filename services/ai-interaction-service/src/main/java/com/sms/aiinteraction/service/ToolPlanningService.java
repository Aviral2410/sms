package com.sms.aiinteraction.service;

import com.sms.aiinteraction.llm.GeminiPlanningEngine;
import com.sms.aiinteraction.llm.OllamaPlanningEngine;
import com.sms.aiinteraction.llm.OpenAiFunctionPlanningEngine;
import com.sms.aiinteraction.llm.RuleBasedPlanningEngine;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ToolPlanningService {
    private final GeminiPlanningEngine geminiPlanner;
    private final OpenAiFunctionPlanningEngine openAiPlanner;
    private final OllamaPlanningEngine ollamaPlanner;
    private final RuleBasedPlanningEngine fallbackPlanner;

    public ToolPlanningService(
            GeminiPlanningEngine geminiPlanner,
            OpenAiFunctionPlanningEngine openAiPlanner,
            OllamaPlanningEngine ollamaPlanner,
            RuleBasedPlanningEngine fallbackPlanner
    ) {
        this.geminiPlanner = geminiPlanner;
        this.openAiPlanner = openAiPlanner;
        this.ollamaPlanner = ollamaPlanner;
        this.fallbackPlanner = fallbackPlanner;
    }

    /**
     * Planning chain: Gemini → OpenAI → Ollama → RuleBased
     * Each engine returns Optional.empty() when its provider is not configured or fails,
     * so the chain degrades gracefully to the next available provider.
     */
    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools) {
        // 1. Gemini (Primary)
        Optional<ToolCall> geminiChoice = geminiPlanner.plan(message, userContext, tools);
        if (geminiChoice.isPresent()) {
            return geminiChoice;
        }

        // 2. OpenAI (Secondary)
        Optional<ToolCall> openAiChoice = openAiPlanner.plan(message, userContext, tools);
        if (openAiChoice.isPresent()) {
            return openAiChoice;
        }

        // 3. Ollama (Local/Fallback)
        Optional<ToolCall> ollamaChoice = ollamaPlanner.plan(message, userContext, tools);
        if (ollamaChoice.isPresent()) {
            return ollamaChoice;
        }

        // 4. RuleBased (Absolute Fallback)
        return fallbackPlanner.plan(message, userContext, tools);
    }
}
