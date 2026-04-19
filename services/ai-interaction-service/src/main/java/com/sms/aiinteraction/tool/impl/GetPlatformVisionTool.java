package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class GetPlatformVisionTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetPlatformVisionTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getPlatformVision";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Retrieve the vision, mission, and 'why choose us' information for the platform.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PUBLIC_ANONYMOUS, UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "### Our Vision\n" +
                "To empower every educational institution with state-of-the-art technology that makes administrative management seamless, transparent, and data-driven.\n\n" +
                "### Why ElevateSmart?\n" +
                "1. **Unified Operating Layer**: We replace fragmented systems with a single connected platform for all school operations.\n" +
                "2. **Real-time Intelligence**: 100% visibility for administrators into attendance, finance, and academic performance.\n" +
                "3. **Stakeholder Engagement**: Bridge the gap between schools, parents, and students with automated notifications and an integrated forum.\n" +
                "4. **AI-Ready Infrastructure**: Designed from the ground up to support predictive analytics and automated task management.\n\n" +
                "### Our Commitment\n" +
                "We are committed to providing a secure, scalable, and easy-to-use platform that grows with your institution, ensuring that technology becomes an enabler, not a hurdle, for education.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
