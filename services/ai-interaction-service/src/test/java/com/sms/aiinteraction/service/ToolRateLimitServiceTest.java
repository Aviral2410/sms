package com.sms.aiinteraction.service;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.mockito.Mockito;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ToolRateLimitServiceTest {

    @Test
    void deniesWhenLocalFallbackLimitExceeded() {
        @SuppressWarnings("unchecked")
        ObjectProvider<StringRedisTemplate> provider = Mockito.mock(ObjectProvider.class);
        Mockito.when(provider.getIfAvailable()).thenReturn(null);
        ToolRateLimitService service = new ToolRateLimitService(provider);
        UserContext user = new UserContext(
                UUID.fromString("0424cb79-79e4-4f2a-ae53-dd2ea7f35fb4"),
                UUID.fromString("4894c8a6-c56f-465f-a2db-c683ca63ad35"),
                UUID.fromString("7fbefbd4-f0d6-44f9-9bdf-4fce2d302262"),
                "admin@example.com",
                "SCHOOL_ADMIN",
                UserRole.SCHOOL_ADMIN,
                "Bearer x",
                "req-rl",
                null
        );

        assertTrue(service.allow(user, "getAttendanceReport", 2));
        assertTrue(service.allow(user, "getAttendanceReport", 2));
        assertFalse(service.allow(user, "getAttendanceReport", 2));
    }
}
