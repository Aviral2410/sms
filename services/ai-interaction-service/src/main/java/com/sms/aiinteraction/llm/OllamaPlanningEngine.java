package com.sms.aiinteraction.llm;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class OllamaPlanningEngine implements LlmPlanningEngine {
    @Override
    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        return Optional.empty(); // Implementation for local fallback
    }
}
