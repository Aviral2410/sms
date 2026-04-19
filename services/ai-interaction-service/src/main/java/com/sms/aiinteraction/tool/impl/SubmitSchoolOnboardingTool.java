package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class SubmitSchoolOnboardingTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public SubmitSchoolOnboardingTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "submitSchoolOnboarding";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        
        props.putObject("schoolName").put("type", "string");
        props.putObject("schoolCode").put("type", "string");
        props.putObject("boardAffiliation").put("type", "string");
        props.putObject("contactPhone").put("type", "string");
        props.putObject("contactEmail").put("type", "string");
        props.putObject("addressLine").put("type", "string");
        props.putObject("city").put("type", "string");
        props.putObject("state").put("type", "string");
        props.putObject("country").put("type", "string");
        props.putObject("postalCode").put("type", "string");
        props.putObject("selectedPlanCode").put("type", "string");

        return new ToolDescriptor(
            name(),
            "Submit the final validated school onboarding request to the platform for review and provisioning.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PUBLIC_ANONYMOUS, UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN);
    }

    @Override
    public boolean cacheable() {
        return false;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        try {
            ObjectNode response = (ObjectNode) gatewayApiClient.post(
                "/api/v1/onboarding/schools",
                arguments,
                userContext.authorization()
            );
            
            ObjectNode data = objectMapper.createObjectNode();
            data.put("text", "Success! Your school onboarding request for '" + arguments.path("schoolName").asText() + 
                    "' has been submitted. Reference ID: " + response.path("onboardingId").asText() + 
                    ". Our team will review the details and get back to you shortly.");
            data.set("onboardingDetails", response);

            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", name());
            meta.put("status", "SUCCESS");

            return new ToolResult("text", data, meta);
        } catch (Exception e) {
            ObjectNode data = objectMapper.createObjectNode();
            data.put("text", "I'm sorry, I couldn't submit the onboarding request: " + e.getMessage());
            
            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", name());
            meta.put("status", "FAILURE");
            
            return new ToolResult("error", data, meta);
        }
    }
}
