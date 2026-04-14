package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuditEventService {
    private static final Logger logger = LoggerFactory.getLogger(AuditEventService.class);
    private final ObjectMapper objectMapper;
    private final AuditTrailStore auditTrailStore;

    public AuditEventService(ObjectMapper objectMapper, AuditTrailStore auditTrailStore) {
        this.objectMapper = objectMapper;
        this.auditTrailStore = auditTrailStore;
    }

    public void requestReceived(UserContext user, String message, String conversationId) {
        logger.info("ai_audit event=request_received requestId={} conversationId={} tenantId={} schoolId={} userId={} role={} messageLength={}",
                user.requestId(), conversationId, user.tenantId(), user.schoolId(), user.userId(), user.role(), message == null ? 0 : message.length());
        append("request_received", user, conversationId)
                .put("messageLength", message == null ? 0 : message.length());
    }

    public void noPlan(UserContext user, String conversationId) {
        logger.info("ai_audit event=no_plan requestId={} conversationId={} tenantId={} schoolId={} userId={} role={}",
                user.requestId(), conversationId, user.tenantId(), user.schoolId(), user.userId(), user.role());
        append("no_plan", user, conversationId);
    }

    public void cacheHit(UserContext user, String tool, String conversationId) {
        logger.info("ai_audit event=cache_hit requestId={} conversationId={} tool={} tenantId={} schoolId={} userId={} role={}",
                user.requestId(), conversationId, tool, user.tenantId(), user.schoolId(), user.userId(), user.role());
        append("cache_hit", user, conversationId).put("tool", tool);
    }

    public void toolExecuted(UserContext user, String tool, String conversationId, long elapsedMs, boolean cached) {
        logger.info("ai_audit event=tool_executed requestId={} conversationId={} tool={} elapsedMs={} cached={} tenantId={} schoolId={} userId={} role={}",
                user.requestId(), conversationId, tool, elapsedMs, cached, user.tenantId(), user.schoolId(), user.userId(), user.role());
        append("tool_executed", user, conversationId)
                .put("tool", tool)
                .put("elapsedMs", elapsedMs)
                .put("cached", cached);
    }

    public void accessDenied(UserContext user, String tool, String reason, String conversationId) {
        logger.warn("ai_audit event=access_denied requestId={} conversationId={} tool={} reason=\"{}\" tenantId={} schoolId={} userId={} role={}",
                user.requestId(), conversationId, tool, reason, user.tenantId(), user.schoolId(), user.userId(), user.role());
        append("access_denied", user, conversationId)
                .put("tool", tool)
                .put("reason", reason == null ? "" : reason);
    }

    public void idempotentSkip(UserContext user, String tool, String idempotencyKey, String conversationId) {
        logger.info("ai_audit event=idempotent_skip requestId={} conversationId={} tool={} idempotencyKey={} tenantId={} schoolId={} userId={} role={}",
                user.requestId(), conversationId, tool, idempotencyKey, user.tenantId(), user.schoolId(), user.userId(), user.role());
        append("idempotent_skip", user, conversationId)
                .put("tool", tool)
                .put("idempotencyKey", idempotencyKey);
    }

    private ObjectNode append(String event, UserContext user, String conversationId) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("event", event);
        node.put("requestId", user.requestId());
        node.put("conversationId", conversationId);
        node.put("tenantId", user.tenantId().toString());
        node.put("schoolId", user.schoolId().toString());
        node.put("userId", user.userId().toString());
        node.put("role", user.role().name());
        auditTrailStore.append(node);
        return node;
    }
}
