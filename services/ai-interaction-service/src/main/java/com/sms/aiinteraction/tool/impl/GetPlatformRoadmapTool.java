package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class GetPlatformRoadmapTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetPlatformRoadmapTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getPlatformRoadmap";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Retrieve information about upcoming features and the long-term product roadmap for the platform.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PUBLIC_ANONYMOUS, UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "Our roadmap for 2026 is focused on enhancing stakeholder engagement and predictive intelligence.");
        
        ArrayNode items = data.putArray("roadmapItems");
        
        ObjectNode item1 = items.addObject();
        item1.put("quarter", "Q2 2026");
        item1.put("feature", "Mobile App for Parents & Students");
        item1.put("status", "In Development");
        
        ObjectNode item2 = items.addObject();
        item2.put("quarter", "Q3 2026");
        item2.put("feature", "AI-Powered Predictive Attendance");
        item2.put("status", "Planning");
        
        ObjectNode item3 = items.addObject();
        item3.put("quarter", "Q4 2026");
        item3.put("feature", "Automated Financial Reconciliation");
        item3.put("status", "Research");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("table", data, meta);
    }
}
