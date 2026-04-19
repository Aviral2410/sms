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
public class GetOnboardingInfoTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetOnboardingInfoTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getOnboardingInfo";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Retrieve details about the school onboarding process, including registration, document requirements, and setup steps.",
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
        data.put("text", "The School Onboarding process is designed to be completed in 4 simple steps:\n\n" +
                "1. **Register Institution**: Visit the landing page and click 'Register School'. You'll need to provide basic details like School Name, Address, and Point of Contact.\n" +
                "2. **Identity Verification**: Our team will review the submitted registration and may reach out for verification documents (School License/Registration certificate).\n" +
                "3. **Workspace Setup**: Once verified, the school admin receives access to the 'Control Plane' to set up academic years, classes, and sections.\n" +
                "4. **Stakeholder Onboarding**: Start adding Teachers and Students. You can either bulk upload via CSV or share invitation codes for self-joining.\n\n" +
                "Need help at any step? Our onboarding specialists are available via the 'Contact Us' section.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
