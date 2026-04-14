package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.common.exception.ForbiddenException;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class RbacPolicyService {
    public void assertAllowed(AiTool tool, UserContext user, ObjectNode args) {
        if (!tool.allowedRoles().contains(user.role())) {
            throw new ForbiddenException("You do not have permission to use this assistant action.");
        }

        if ("getStudentPerformance".equals(tool.name())) {
            enforceStudentPerformanceScope(user, args);
        }

        if ("sendNotification".equals(tool.name())) {
            Set<UserRole> notificationWriters = Set.of(
                    UserRole.PLATFORM_ADMIN,
                    UserRole.SCHOOL_ADMIN,
                    UserRole.TEACHER,
                    UserRole.STAFF
            );
            if (!notificationWriters.contains(user.role())) {
                throw new ForbiddenException("You do not have permission to send notifications.");
            }
        }
    }

    private void enforceStudentPerformanceScope(UserContext user, ObjectNode args) {
        String studentIdRaw = args.hasNonNull("studentId") ? args.get("studentId").asText().trim() : null;
        UUID requested = null;
        if (studentIdRaw != null && !studentIdRaw.isBlank()) {
            try {
                requested = UUID.fromString(studentIdRaw);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid studentId.");
            }
        }

        if (user.role() == UserRole.STUDENT) {
            if (requested != null && !requested.equals(user.userId())) {
                throw new ForbiddenException("Students can only access their own performance.");
            }
            args.put("studentId", user.userId().toString());
            return;
        }

        if (user.role() == UserRole.PARENT) {
            if (requested == null) {
                throw new ForbiddenException("Parent requests must include a permitted child studentId.");
            }
        }

        if (user.role() == UserRole.TEACHER && requested == null) {
            throw new ForbiddenException("Teacher requests require a studentId in scope.");
        }
    }
}
