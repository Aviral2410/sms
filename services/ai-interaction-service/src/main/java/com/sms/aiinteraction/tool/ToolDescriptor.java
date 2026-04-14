package com.sms.aiinteraction.tool;

import com.fasterxml.jackson.databind.JsonNode;

public record ToolDescriptor(
        String name,
        String description,
        JsonNode inputSchema
) {}
