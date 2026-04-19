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
public class GetSupportInfoTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetSupportInfoTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getSupportInfo";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Information on how to raise tickets, contact support, or get technical help.",
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
        data.put("text", "We provide 24/7 technical support to all our users. Here is how you can reach us:\n\n" +
                "- **Support Portal**: Visit [support.elevatesmart.io](https://support.elevatesmart.io) to raise a ticket. You can track the status of your reported issues in real-time.\n" +
                "- **In-App Help**: If you are logged in, click the '?' icon on your dashboard to use the 'Raise Support' feature directly.\n" +
                "- **Email Support**: For non-urgent queries, email us at `support@elevatesmart.io` with your institution name and a detailed description of the issue.\n" +
                "- **Emergency Helpline**: Premium and Enterprise tier schools have access to a dedicated 24/7 priority phone line for critical outages.\n\n" +
                "**Common Issues**: Check our 'FAQ' section on the landing page for quick answers about password recovery, payment failures, or data sync issues.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
