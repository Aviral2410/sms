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
public class GetSchoolJoiningInfoTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetSchoolJoiningInfoTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getSchoolJoiningInfo";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Explain how students and parents can join their institution's digital platform.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PUBLIC_ANONYMOUS, UserRole.STUDENT, UserRole.PARENT);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "To join your school on ElevateSmart, follow these steps:\n\n" +
                "1. **Get an Invitation Code**: Your school administrator or teacher will provide a unique 'School Joining Code'. This is typically a 6 or 8 character alphanumeric string.\n" +
                "2. **Visit the Join Page**: Go to the 'Join Institution' section of our website or mobile app.\n" +
                "3. **Enter Details**: Put in the Invitation Code along with your student ID or registered mobile number.\n" +
                "4. **Verification**: You may be asked to verify your identity via an OTP sent to your registered contact number.\n" +
                "5. **Onboard**: Once verified, you will be automatically linked to your class and can start viewing attendance, homework, and fees.\n\n" +
                "If you haven't received a code yet, please contact your class teacher.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
