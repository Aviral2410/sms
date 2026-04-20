package com.sms.aiinteraction.service;

import com.sms.aiinteraction.llm.GeminiPlanningEngine;
import com.sms.aiinteraction.llm.OllamaPlanningEngine;
import com.sms.aiinteraction.llm.OpenAiFunctionPlanningEngine;
import com.sms.aiinteraction.llm.RuleBasedPlanningEngine;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
@Slf4j
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

    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        log.info("[ORCHESTRATOR] Planning tool call for request: {} (History size: {})", message, history.size());

        return geminiPlanner.plan(message, userContext, tools, history)
                .or(() -> openAiPlanner.plan(message, userContext, tools, history))
                .or(() -> ollamaPlanner.plan(message, userContext, tools, history))
                .or(() -> fallbackPlanner.plan(message, userContext, tools, history));
    }
}
