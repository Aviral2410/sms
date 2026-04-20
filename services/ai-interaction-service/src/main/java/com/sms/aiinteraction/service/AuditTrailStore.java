package com.sms.aiinteraction.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.domain.AuditEvent;
import com.sms.aiinteraction.repository.AuditEventRepository;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.common.exception.ForbiddenException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class AuditTrailStore {
    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public AuditTrailStore(AuditEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public void append(ObjectNode event) {
        String type = event.path("type").asText("GENERAL");
        String uid = event.path("userId").asText("system");
        String sidStr = event.path("schoolId").asText(null);
        UUID schoolId = (sidStr != null && !sidStr.isEmpty()) ? UUID.fromString(sidStr) : null;
        String status = event.path("status").asText("SUCCESS");

        AuditEvent auditEvent = AuditEvent.builder()
                .timestamp(Instant.now())
                .eventType(type)
                .userId(uid)
                .schoolId(schoolId)
                .payload(event.toString())
                .status(status)
                .build();
        
        repository.save(auditEvent);
    }

    public List<JsonNode> list(UserContext user, int limit) {
        int max = Math.max(1, Math.min(limit, 500));
        if (user.role() != UserRole.PLATFORM_ADMIN && user.role() != UserRole.SCHOOL_ADMIN) {
            throw new ForbiddenException("You do not have permission to view AI audit events.");
        }

        List<AuditEvent> events;
        if (user.role() == UserRole.PLATFORM_ADMIN) {
            events = repository.findAllByOrderByTimestampDesc(PageRequest.of(0, max));
        } else {
            events = repository.findAllBySchoolIdOrderByTimestampDesc(user.schoolId(), PageRequest.of(0, max));
        }

        return events.stream()
                .map(e -> {
                    try {
                        return (JsonNode) objectMapper.readTree(e.getPayload());
                    } catch (JsonProcessingException ex) {
                        return (JsonNode) objectMapper.createObjectNode().put("error", "Serialization failed");
                    }
                })
                .collect(Collectors.toList());
    }
}
