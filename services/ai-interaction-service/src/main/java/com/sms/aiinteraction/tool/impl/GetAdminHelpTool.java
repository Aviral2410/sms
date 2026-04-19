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
public class GetAdminHelpTool implements AiTool {
    private final ObjectMapper objectMapper;

    public GetAdminHelpTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getAdminHelp";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(
            name(),
            "Guide school administrators on common management tasks like adding users, managing fees, and configuring school settings.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "As a School Administrator, you have several primary management responsibilities:\n\n" +
                "1. **User Management**: To add a new Teacher or Student, go to the 'Users' section in your dashboard. You can use the 'Bulk Upload' feature for large batches or 'Invite' for individual additions.\n" +
                "2. **Fee Configuration**: Set up fee structures, deadlines, and discounts under the 'Finance' module. Automated invoices will be generated for students based on these configurations.\n" +
                "3. **Timetable & Attendance**: Configure class timings and subject assignments in the 'Academics' section. Teachers can then record attendance and mark lessons as complete.\n" +
                "4. **Communication**: Broadcast announcements to specific classes or the entire school using the 'Announcements' tool. You can choose to send via Dashboard, Email, or SMS.\n" +
                "5. **System Settings**: Customize your school's public profile, house system, and institutional settings in the 'Control Plane'.\n\n" +
                "Detailed walkthroughs for each module are available in the 'Admin Guide' section of the help portal.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
