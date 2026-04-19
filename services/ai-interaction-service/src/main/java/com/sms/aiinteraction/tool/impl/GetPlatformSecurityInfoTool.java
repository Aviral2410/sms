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
public class GetPlatformSecurityInfoTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetPlatformSecurityInfoTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getPlatformSecurityInfo";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Retrieve detailed information about platform security, encryption protocols, and data privacy measures.",
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
        data.put("text", "### ElevateSmart Security & Privacy Protocols\n\n" +
                "ElevateSmart is built with a 'Security-First' philosophy to protect sensitive educational data. Our infrastructure includes:\n\n" +
                "1. **Advanced Encryption**: All data is encrypted at rest using AES-256 and in transit via TLS 1.3. This ensures that school, student, and financial records remain private.\n" +
                "2. **Secure Real-time Streaming (SSE)**: Our AI interactions use Secure Server-Sent Events (SSE) to prevent unauthorized interception of data during live chat responses.\n" +
                "3. **Modular Access Control (RBAC)**: Fine-grained Role-Based Access Control ensures that teachers, students, and admins only see the data they are authorized to access.\n" +
                "4. **Guest Session Isolation**: Anonymous sessions use unique, isolated Guest-IDs to ensure chat history is persistent yet private for each user.\n" +
                "5. **Multi-Tenant Security**: Every school operates in an isolated tenant environment, preventing cross-institutional data leaks.\n" +
                "6. **Ollama Localized Models**: Where possible, our AI core can run on-premise or in private clouds, ensuring institutional prompts never leave your secure perimeter.\n\n" +
                "We conduct regular security audits and penetration testing to maintain our 'Institutional Grade' safety standards.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
