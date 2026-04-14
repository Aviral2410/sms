package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.aiinteraction.api.AiInteractionDtos;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.common.exception.ForbiddenException;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitPolicyServiceTest {
    private final CacheService cacheService = Mockito.mock(CacheService.class);
    private final GatewayApiClient gatewayApiClient = Mockito.mock(GatewayApiClient.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RateLimitPolicyService service = new RateLimitPolicyService(cacheService, gatewayApiClient, objectMapper);

    @Test
    void onlyPlatformAdminCanUpdatePolicy() {
        UserContext schoolAdmin = user(UserRole.SCHOOL_ADMIN);
        AiInteractionDtos.PlanToolRateLimits payload = new AiInteractionDtos.PlanToolRateLimits(
                Map.of("FREE", Map.of("getAttendanceReport", 10))
        );
        assertThrows(ForbiddenException.class, () -> service.updatePolicy(schoolAdmin, payload));
    }

    @Test
    void platformAdminCanReadDefaults() {
        UserContext platformAdmin = user(UserRole.PLATFORM_ADMIN);
        AiInteractionDtos.RateLimitPolicyResponse response = service.readPolicy(platformAdmin);
        assertEquals("v1", response.policyVersion());
        assertTrue(response.limits().containsKey("FREE"));
    }

    private UserContext user(UserRole role) {
        return new UserContext(
                UUID.fromString("4f2f9e5a-43e0-4fb6-8652-2a9f2c819c83"),
                UUID.fromString("f56f6db0-cf66-4f80-b9d5-b96d95f73ff0"),
                UUID.fromString("412c9f44-c2d4-4ac8-b6c0-df1ef170f6f2"),
                "user@example.com",
                role.name(),
                role,
                "Bearer fake",
                "req-policy"
        );
    }
}
