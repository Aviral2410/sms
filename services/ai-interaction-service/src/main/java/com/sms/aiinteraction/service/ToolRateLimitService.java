package com.sms.aiinteraction.service;

import com.sms.aiinteraction.security.UserContext;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class ToolRateLimitService {
    private final StringRedisTemplate redisTemplate;
    private final Map<String, LocalCounter> fallbackCounters = new ConcurrentHashMap<>();

    public ToolRateLimitService(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    public boolean allow(UserContext user, String toolName, int limitPerMinute) {
        long minuteBucket = System.currentTimeMillis() / 60000L;
        String key = "ai:ratelimit:" + user.tenantId() + ":" + user.schoolId() + ":" + user.userId() + ":" + toolName + ":" + minuteBucket;

        try {
            if (redisTemplate != null) {
                Long count = redisTemplate.opsForValue().increment(key);
                if (count != null && count == 1L) {
                    redisTemplate.expire(key, Duration.ofMinutes(2));
                }
                return count != null && count <= limitPerMinute;
            }
        } catch (Exception ignored) {
            // fallback
        }

        long now = System.currentTimeMillis();
        LocalCounter counter = fallbackCounters.compute(key, (k, current) -> {
            if (current == null || current.expiresAtEpochMs < now) {
                return new LocalCounter(1, now + Duration.ofMinutes(2).toMillis());
            }
            current.count++;
            return current;
        });
        return counter.count <= limitPerMinute;
    }

    private static class LocalCounter {
        private int count;
        private final long expiresAtEpochMs;

        private LocalCounter(int count, long expiresAtEpochMs) {
            this.count = count;
            this.expiresAtEpochMs = expiresAtEpochMs;
        }
    }
}
