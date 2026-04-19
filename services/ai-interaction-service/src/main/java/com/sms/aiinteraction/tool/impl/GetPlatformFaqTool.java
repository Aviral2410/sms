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
public class GetPlatformFaqTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetPlatformFaqTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getPlatformFaq";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Answers frequently asked questions about platform security, data privacy, mobile access, customization, and scalability.",
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
        data.put("text", "### Frequently Asked Questions\n\n" +
                "**1. How secure is our school's data?**\n" +
                "We use end-to-end encryption for all data at rest and in transit. Our platform is hosted on secure cloud infrastructure with regular security audits and compliant with international data protection standards.\n\n" +
                "**2. Can we customize the dashboard for our school?**\n" +
                "Yes! School Administrators can customize theme colors, logos, and mission statements. You can also enable or disable specific modules (like Transport or Library) based on your school's needs.\n\n" +
                "**3. Is there a mobile app available?**\n" +
                "Currently, the platform is fully responsive and works beautifully on all mobile browsers. A dedicated native mobile app for Parents and Students is currently in development (target release Q2 2026).\n\n" +
                "**4. Can the platform handle large institutions with 5000+ students?**\n" +
                "Absolutely. Our architecture is built on a scalable microservices foundation (Kubernetes) that can handle high loads and large datasets across multiple institutions seamlessly.\n\n" +
                "**5. What happens if we lose internet connectivity?**\n" +
                "The platform requires an active connection for real-time updates. However, we are exploring 'Offline Mode' capabilities for certain academic functions like taking attendance and marking grades.\n\n" +
                "**6. How do I reset my school context?**\n" +
                "Your 'School Code' is permanent once assigned. If you've lost it, please contact your account manager or platform support.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
