package com.sms.aiinteraction.tool;

import com.fasterxml.jackson.databind.JsonNode;

public record ToolResult(
        String outputType,
        JsonNode data,
        JsonNode meta
) {}
