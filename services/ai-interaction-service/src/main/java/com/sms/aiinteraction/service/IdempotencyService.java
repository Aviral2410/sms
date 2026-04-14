package com.sms.aiinteraction.service;

import com.sms.aiinteraction.security.UserContext;
import java.time.Duration;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {
    private final CacheService cacheService;

    public IdempotencyService(CacheService cacheService) {
        this.cacheService = cacheService;
    }

    public boolean claim(UserContext user, String toolName, String key, Duration ttl) {
        String cacheKey = "ai:idempotency:" + user.tenantId() + ":" + user.schoolId() + ":" + toolName + ":" + key;
        return cacheService.putIfAbsent(cacheKey, UUID.randomUUID().toString(), ttl);
    }
}
