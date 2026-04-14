package com.sms.aiinteraction.tool;

import com.fasterxml.jackson.databind.node.ObjectNode;

public record ToolCall(
        String toolName,
        ObjectNode arguments,
        String reasoning
) {}
