package com.sms.aiinteraction.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AiInteractionProperties(
        String gatewayBaseUrl,
        LlmProperties llm,
        CacheProperties cache
) {
    public record LlmProperties(
            String provider,
            String openaiApiKey,
            String openaiModel,
            String ollamaBaseUrl,
            String ollamaModel
    ) {}

    public record CacheProperties(
            long promptTtlSeconds,
            long reportTtlSeconds
    ) {}
}
