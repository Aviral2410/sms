package com.sms.aiinteraction.service;

import com.sms.aiinteraction.llm.GeminiPlanningEngine;
import com.sms.aiinteraction.llm.OllamaPlanningEngine;
import com.sms.aiinteraction.llm.OpenAiFunctionPlanningEngine;
import com.sms.aiinteraction.llm.RuleBasedPlanningEngine;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ToolPlanningService {
    private static final Logger log = LoggerFactory.getLogger(ToolPlanningService.class);

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

    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        log.info("[ORCHESTRATOR] Multi-tool planning for request: {} (History size: {})", message, history.size());

        List<ToolCall> calls = geminiPlanner.plan(message, userContext, tools, history);
        if (!calls.isEmpty()) return calls;

        calls = openAiPlanner.plan(message, userContext, tools, history);
        if (!calls.isEmpty()) return calls;

        calls = ollamaPlanner.plan(message, userContext, tools, history);
        if (!calls.isEmpty()) return calls;

        return fallbackPlanner.plan(message, userContext, tools, history);
    }
}
