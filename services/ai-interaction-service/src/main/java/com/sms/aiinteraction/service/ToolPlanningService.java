package com.sms.aiinteraction.service;

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
    private final OllamaPlanningEngine ollamaPlanner;
    private final OpenAiFunctionPlanningEngine openAiPlanner;
    private final RuleBasedPlanningEngine fallbackPlanner;

    public ToolPlanningService(
            OllamaPlanningEngine ollamaPlanner,
            OpenAiFunctionPlanningEngine openAiPlanner,
            RuleBasedPlanningEngine fallbackPlanner
    ) {
        this.ollamaPlanner = ollamaPlanner;
        this.openAiPlanner = openAiPlanner;
        this.fallbackPlanner = fallbackPlanner;
    }

    /**
     * Planning chain: Ollama → OpenAI → RuleBased
     * Each engine returns Optional.empty() when its provider is not configured,
     * so the chain degrades gracefully without errors.
     */
    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools) {
        Optional<ToolCall> ollamaChoice = ollamaPlanner.plan(message, userContext, tools);
        if (ollamaChoice.isPresent()) {
            return ollamaChoice;
        }
        Optional<ToolCall> openAiChoice = openAiPlanner.plan(message, userContext, tools);
        if (openAiChoice.isPresent()) {
            return openAiChoice;
        }
        return fallbackPlanner.plan(message, userContext, tools);
    }
}
