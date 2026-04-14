package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.common.exception.ForbiddenException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.stereotype.Service;

@Service
public class AuditTrailStore {
    private static final int MAX_EVENTS = 5000;
    private final Deque<ObjectNode> events = new ConcurrentLinkedDeque<>();

    public void append(ObjectNode event) {
        event.put("timestamp", Instant.now().toString());
        events.addFirst(event);
        while (events.size() > MAX_EVENTS) {
            events.pollLast();
        }
    }

    public List<JsonNode> list(UserContext user, int limit) {
        int max = Math.max(1, Math.min(limit, 500));
        if (user.role() != UserRole.PLATFORM_ADMIN && user.role() != UserRole.SCHOOL_ADMIN) {
            throw new ForbiddenException("You do not have permission to view AI audit events.");
        }

        List<JsonNode> out = new ArrayList<>(max);
        for (ObjectNode event : events) {
            if (out.size() >= max) break;
            if (user.role() == UserRole.PLATFORM_ADMIN) {
                out.add(event.deepCopy());
                continue;
            }
            String eventSchoolId = event.path("schoolId").asText();
            if (user.schoolId().toString().equals(eventSchoolId)) {
                out.add(event.deepCopy());
            }
        }
        return out;
    }
}
