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
public class GetPublicPlatformInfoTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetPublicPlatformInfoTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getPublicPlatformInfo";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Retrieve general information about the platform, including modules (attendance, transport, finance), pricing tiers, and vision.",
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
        data.put("text", "ElevateSmart is a unified operating layer designed for modern educational institutions, providing 100% visibility through a single connected platform.\n\n" +
                "### Detailed Module Breakdown:\n" +
                "1. **Academics Core**:\n" +
                "   - **Attendance**: Real-time tracking and automated parent notifications.\n" +
                "   - **Homework**: Centralized management with student submission tracking.\n" +
                "   - **Library**: Digital catalog and resource lending management.\n" +
                "   - **Exams**: Result analysis and automated transcript generation.\n\n" +
                "2. **Operations & Connectivity**:\n" +
                "   - **Transport**: Real-time vehicle tracking and route optimization.\n" +
                "   - **Communication**: Integrated forum, announcements, and SMS/Email notifications.\n" +
                "   - **Announcements**: Multi-channel broadcast for critical school-wide alerts.\n\n" +
                "3. **Financial Intelligence**:\n" +
                "   - **Fee Management**: Automated invoicing and collection tracking.\n" +
                "   - **Defaulters Tracking**: Financial insights to help institutions manage cash flow.\n" +
                "   - **Subscription**: Management of school-tiers and capacity.\n\n" +
                "4. **AI Assistant Layer**:\n" +
                "   - Real-time insights, task automation, and predictive analytics available for all stakeholders.\n\n" +
                "**Vision**: To empower every educational institution with state-of-the-art technology that makes administrative management seamless and transparent.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
