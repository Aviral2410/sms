package com.sms.aiinteraction.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserContextResolver;
import com.sms.aiinteraction.service.AuditTrailStore;
import com.sms.aiinteraction.service.RateLimitPolicyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai-interaction")
public class AiAdminController {

    private final RateLimitPolicyService rateLimitPolicyService;
    private final AuditTrailStore auditTrailStore;
    private final UserContextResolver userContextResolver;

    public AiAdminController(
            RateLimitPolicyService rateLimitPolicyService,
            AuditTrailStore auditTrailStore,
            UserContextResolver userContextResolver
    ) {
        this.rateLimitPolicyService = rateLimitPolicyService;
        this.auditTrailStore = auditTrailStore;
        this.userContextResolver = userContextResolver;
    }

    @GetMapping("/admin/rate-limits")
    public ResponseEntity<AiInteractionDtos.RateLimitPolicyResponse> getRateLimits(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(rateLimitPolicyService.readPolicy(user));
    }

    @PostMapping("/admin/rate-limits")
    public ResponseEntity<AiInteractionDtos.RateLimitPolicyResponse> updateRateLimits(
            @Valid @RequestBody AiInteractionDtos.PlanToolRateLimits request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(rateLimitPolicyService.updatePolicy(user, request));
    }

    @GetMapping("/audit/events")
    public ResponseEntity<List<JsonNode>> listAuditEvents(
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(auditTrailStore.list(user, limit));
    }
}
