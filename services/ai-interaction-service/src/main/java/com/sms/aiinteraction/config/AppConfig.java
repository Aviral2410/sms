package com.sms.aiinteraction.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(AiInteractionProperties.class)
public class AppConfig {

    @Bean
    public RestClient gatewayRestClient(AiInteractionProperties properties) {
        return RestClient.builder()
                .baseUrl(properties.gatewayBaseUrl())
                .build();
    }
}
