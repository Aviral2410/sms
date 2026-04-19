package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.ConversationMemoryService;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class SubmitCreateWorkspaceTool implements AiTool {
    private final ConversationMemoryService conversationMemoryService;
    private final ObjectMapper objectMapper;

    public SubmitCreateWorkspaceTool(ConversationMemoryService conversationMemoryService, ObjectMapper objectMapper) {
        this.conversationMemoryService = conversationMemoryService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "submitCreateWorkspace";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode properties = schema.putObject("properties");
        
        ObjectNode nameParam = properties.putObject("name");
        nameParam.put("type", "string");
        nameParam.put("description", "A descriptive name for the new workspace.");
        
        schema.putArray("required").add("name");
        
        return new ToolDescriptor(
            name(),
            "Create a new workspace for the current user to organize chats. Only for logged-in users.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT);
    }

    @Override
    public boolean cacheable() {
        return false;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        if (userContext.role() == UserRole.PUBLIC_ANONYMOUS) {
            ObjectNode error = objectMapper.createObjectNode();
            error.put("text", "You must be signed in to create custom workspaces.");
            return new ToolResult("error", error, objectMapper.createObjectNode());
        }

        String name = arguments.path("name").asText("New Workspace");
        ConversationMemoryService.WorkspaceRecord workspace = conversationMemoryService.createWorkspace(userContext, name);

        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "Great! I've created your new workspace: **" + workspace.name() + "**. You can now start new conversations within this workspace.");
        data.put("workspaceId", workspace.workspaceId().toString());
        data.put("name", workspace.name());

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("text", data, meta);
    }
}
