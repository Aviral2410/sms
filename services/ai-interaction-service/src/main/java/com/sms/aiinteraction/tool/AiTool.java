package com.sms.aiinteraction.tool;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import java.util.Set;

public interface AiTool {
    String name();

    ToolDescriptor descriptor();

    Set<UserRole> allowedRoles();

    boolean cacheable();

    default boolean requiresConfirmation() {
        return false;
    }

    ToolResult execute(ObjectNode arguments, UserContext userContext);
}
