package com.sms.aiinteraction.llm;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import java.util.List;

public interface LlmPlanningEngine {
    List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history);
}
