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
public class GetAuthHelpTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetAuthHelpTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getAuthHelp";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Guide users on how to sign in or sign up for the platform based on their role.",
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
        data.put("text", "Accessing the ElevateSmart platform depends on your role:\n\n" +
                "- **School Admins**: If your school is already registered, use the login credentials provided during the onboarding process. New schools can sign up by clicking 'Register School' on the landing page.\n" +
                "- **Teachers**: Use the credentials provided by your School Administrator. If you haven't received them, please contact your school's IT or Admin department.\n" +
                "- **Students & Parents**: You generally don't 'Sign Up' directly for a school. Instead, your school will provide you with a 'School Invitation Code' or login credentials. Use the 'Join School' page to enter your invitation code and set up your student/parent account.\n\n" +
                "**Forgot Password?**: Use the 'Forgot Password' link on the login page to reset your credentials via your registered email or phone number.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
