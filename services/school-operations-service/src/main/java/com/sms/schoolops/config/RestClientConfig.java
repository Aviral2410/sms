package com.sms.schoolops.config;

import java.util.ArrayList;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate template = new RestTemplate();
        ArrayList<ClientHttpRequestInterceptor> interceptors = new ArrayList<>(template.getInterceptors());
        interceptors.add((request, body, execution) -> {
            String requestId = MDC.get("requestId");
            if (requestId != null && !requestId.isBlank()) {
                request.getHeaders().set("X-Request-ID", requestId);
            }
            return execution.execute(request, body);
        });
        template.setInterceptors(interceptors);
        return template;
    }
}
