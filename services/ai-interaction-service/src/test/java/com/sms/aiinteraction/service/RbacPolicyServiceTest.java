package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import com.sms.common.exception.ForbiddenException;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RbacPolicyServiceTest {
    private final RbacPolicyService service = new RbacPolicyService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void studentCannotQueryOtherStudentPerformance() {
        UUID actorId = UUID.fromString("4ed053cf-c33b-43ab-bf34-81d75eb74d5a");
        UUID otherStudent = UUID.fromString("912d7f0c-b432-494a-8f04-cfe71a2ce983");
        UserContext user = user(actorId, UserRole.STUDENT);
        ObjectNode args = objectMapper.createObjectNode();
        args.put("studentId", otherStudent.toString());

        assertThrows(ForbiddenException.class, () ->
                service.assertAllowed(new FakeTool("getStudentPerformance"), user, args));
    }

    @Test
    void studentDefaultsToSelfWhenStudentIdMissing() {
        UUID actorId = UUID.fromString("4ed053cf-c33b-43ab-bf34-81d75eb74d5a");
        UserContext user = user(actorId, UserRole.STUDENT);
        ObjectNode args = objectMapper.createObjectNode();

        service.assertAllowed(new FakeTool("getStudentPerformance"), user, args);

        assertEquals(actorId.toString(), args.get("studentId").asText());
    }

    private UserContext user(UUID userId, UserRole role) {
        return new UserContext(
                userId,
                UUID.fromString("63036ea4-0f89-44f8-a4c8-70678b69f7d2"),
                UUID.fromString("595ff23b-00f6-4e52-b55e-13698e906560"),
                "actor@example.com",
                role.name(),
                role,
                "Bearer fake",
                "req-1"
        );
    }

    private static class FakeTool implements AiTool {
        private final String name;

        private FakeTool(String name) {
            this.name = name;
        }

        @Override
        public String name() {
            return name;
        }

        @Override
        public ToolDescriptor descriptor() {
            return new ToolDescriptor(name, "fake", new ObjectMapper().createObjectNode());
        }

        @Override
        public Set<UserRole> allowedRoles() {
            return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT, UserRole.STAFF);
        }

        @Override
        public boolean cacheable() {
            return false;
        }

        @Override
        public ToolResult execute(ObjectNode arguments, UserContext userContext) {
            return null;
        }
    }
}
