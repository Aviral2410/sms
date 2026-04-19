package com.sms.aiinteraction.llm;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.util.List;
import java.util.Optional;

public interface LlmPlanningEngine {
    Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<String> history);
}
