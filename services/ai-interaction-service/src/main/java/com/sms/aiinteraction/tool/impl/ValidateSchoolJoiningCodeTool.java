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
public class ValidateSchoolJoiningCodeTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public ValidateSchoolJoiningCodeTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "validateSchoolJoiningCode";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("schoolCode").put("type", "string");

        return new ToolDescriptor(
            name(),
            "Validate a school context/joining code and retrieve basic institution details for confirmation.",
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
        String schoolCode = arguments.path("schoolCode").asText();
        try {
            ObjectNode response = (ObjectNode) gatewayApiClient.get(
                "/api/v1/onboarding/schools/public/" + schoolCode,
                null,
                userContext.authorization()
            );
            
            ObjectNode data = objectMapper.createObjectNode();
            data.put("text", "Code verified! I found '" + response.path("schoolName").asText() + 
                    "' in " + response.path("city").asText() + ", " + response.path("state").asText() + 
                    ". Would you like to proceed with joining this institution?");
            data.set("schoolDetails", response);
            data.put("isValid", true);

            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", name());

            return new ToolResult("status", data, meta);
        } catch (Exception e) {
            ObjectNode data = objectMapper.createObjectNode();
            data.put("text", "I'm sorry, I couldn't find any institution with code '" + schoolCode + "'. Please double-check the code and try again.");
            data.put("isValid", false);
            
            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", name());
            
            return new ToolResult("status", data, meta);
        }
    }
}
