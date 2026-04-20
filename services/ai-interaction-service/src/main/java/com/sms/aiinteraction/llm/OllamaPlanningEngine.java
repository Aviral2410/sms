package com.sms.aiinteraction.llm;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OllamaPlanningEngine implements LlmPlanningEngine {
    @Override
    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        return Collections.emptyList();
    }
}
