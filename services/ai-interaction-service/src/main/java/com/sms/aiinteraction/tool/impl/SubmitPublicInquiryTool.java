package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Collections;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class SubmitPublicInquiryTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public SubmitPublicInquiryTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "submitPublicInquiry";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        
        props.putObject("fullName").put("type", "string").put("description", "User's full name");
        props.putObject("email").put("type", "string").put("description", "User's contact email");
        props.putObject("subject").put("type", "string").put("description", "Subject of the inquiry or ticket");
        props.putObject("message").put("type", "string").put("description", "Details of the support request or demo inquiry");
        props.putObject("inquiryType").put("type", "string").put("enum", objectMapper.createArrayNode().add("CONTACT").add("SUPPORT"));
        
        schema.set("required", objectMapper.createArrayNode().add("fullName").add("email").add("subject").add("message").add("inquiryType"));
        
        return new ToolDescriptor(
            name(),
            "Submit a public inquiry such as a support ticket (SUPPORT) or a demo request/general contact (CONTACT).",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PUBLIC_ANONYMOUS);
    }

    @Override
    public boolean cacheable() {
        return false;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        String type = arguments.path("inquiryType").asText("CONTACT");
        String path = type.equals("SUPPORT") ? "/api/v1/public/support-requests" : "/api/v1/public/contact-requests";
        
        ObjectNode body = objectMapper.createObjectNode();
        body.set("fullName", arguments.get("fullName"));
        body.set("email", arguments.get("email"));
        body.set("subject", arguments.get("subject"));
        body.set("message", arguments.get("message"));

        gatewayApiClient.post(
            path,
            body,
            userContext.authorization()
        );

        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "Thank you, " + arguments.path("fullName").asText() + ". Your " + 
                (type.equals("SUPPORT") ? "support ticket" : "demo request") + 
                " has been successfully submitted. Our team will contact you at " + 
                arguments.path("email").asText() + " shortly.");
        data.put("status", "SUCCESS");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
