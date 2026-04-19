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
public class SubmitSupportTicketTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public SubmitSupportTicketTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "submitSupportTicket";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        
        props.putObject("fullName").put("type", "string");
        props.putObject("email").put("type", "string");
        props.putObject("phone").put("type", "string");
        props.putObject("subject").put("type", "string");
        props.putObject("message").put("type", "string");
        props.putObject("organization").put("type", "string");

        return new ToolDescriptor(
            name(),
            "Raise a formal support ticket or inquiry to the platform on behalf of the user. Should be used when users face issues or have specific technical queries.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PUBLIC_ANONYMOUS, UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT);
    }

    @Override
    public boolean cacheable() {
        return false;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        try {
            // We'll reuse the public inquiry endpoint for support tickets
            ObjectNode response = (ObjectNode) gatewayApiClient.post(
                "/api/v1/onboarding/schools/public/inquiry",
                arguments,
                userContext.authorization()
            );
            
            ObjectNode data = objectMapper.createObjectNode();
            data.put("text", "I've successfully raised a support ticket for you. Reference ID: " + response.path("inquiryId").asText() + 
                    ". Our support team will review your message and contact you at " + arguments.path("email").asText() + ".");
            data.set("ticketDetails", response);

            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", name());
            meta.put("status", "SUCCESS");

            return new ToolResult("text", data, meta);
        } catch (Exception e) {
            ObjectNode data = objectMapper.createObjectNode();
            data.put("text", "I couldn't raise the support ticket: " + e.getMessage());
            
            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", name());
            meta.put("status", "FAILURE");
            
            return new ToolResult("error", data, meta);
        }
    }
}
