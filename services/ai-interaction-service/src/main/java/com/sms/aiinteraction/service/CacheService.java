package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class CacheService {
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;
    private final Map<String, LocalCacheEntry> fallbackCache = new ConcurrentHashMap<>();

    public CacheService(ObjectMapper objectMapper, ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    public Optional<JsonNode> get(String key) {
        try {
            if (redisTemplate != null) {
                String raw = redisTemplate.opsForValue().get(key);
                if (raw != null) return Optional.of(objectMapper.readTree(raw));
            }
        } catch (Exception ignored) {
            // Fall through to local cache fallback.
        }

        LocalCacheEntry local = fallbackCache.get(key);
        if (local == null || local.expiresAtEpochMs < System.currentTimeMillis()) {
            fallbackCache.remove(key);
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readTree(local.rawJson));
        } catch (Exception ignored) {
            fallbackCache.remove(key);
            return Optional.empty();
        }
    }

    public void put(String key, JsonNode value, Duration ttl) {
        String raw;
        try {
            raw = objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return;
        }

        try {
            if (redisTemplate != null) {
                redisTemplate.opsForValue().set(key, raw, ttl);
                return;
            }
        } catch (Exception ignored) {
            // Use local fallback.
        }

        fallbackCache.put(key, new LocalCacheEntry(raw, System.currentTimeMillis() + ttl.toMillis()));
    }

    public boolean putIfAbsent(String key, String rawValue, Duration ttl) {
        try {
            if (redisTemplate != null) {
                Boolean added = redisTemplate.opsForValue().setIfAbsent(key, rawValue, ttl);
                return Boolean.TRUE.equals(added);
            }
        } catch (Exception ignored) {
            // Use local fallback.
        }

        LocalCacheEntry existing = fallbackCache.get(key);
        long now = System.currentTimeMillis();
        if (existing != null && existing.expiresAtEpochMs >= now) {
            return false;
        }
        fallbackCache.put(key, new LocalCacheEntry(rawValue, now + ttl.toMillis()));
        return true;
    }

    public void delete(String key) {
        try {
            if (redisTemplate != null) {
                redisTemplate.delete(key);
            }
        } catch (Exception ignored) {
            // Fallback below.
        }
        fallbackCache.remove(key);
    }

    private record LocalCacheEntry(String rawJson, long expiresAtEpochMs) {}
}
