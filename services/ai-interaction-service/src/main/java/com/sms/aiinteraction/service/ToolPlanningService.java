package com.sms.aiinteraction.service;

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
    private final OpenAiFunctionPlanningEngine openAiPlanner;
    private final RuleBasedPlanningEngine fallbackPlanner;

    public ToolPlanningService(
            OpenAiFunctionPlanningEngine openAiPlanner,
            RuleBasedPlanningEngine fallbackPlanner
    ) {
        this.openAiPlanner = openAiPlanner;
        this.fallbackPlanner = fallbackPlanner;
    }

    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools) {
        Optional<ToolCall> openAiChoice = openAiPlanner.plan(message, userContext, tools);
        if (openAiChoice.isPresent()) {
            return openAiChoice;
        }
        return fallbackPlanner.plan(message, userContext, tools);
    }
}
