package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GatewayApiClient {
    private final RestClient restClient;
    public GatewayApiClient(RestClient gatewayRestClient) {
        this.restClient = gatewayRestClient;
    }

    public JsonNode get(String path, Map<String, ?> queryParams, String authorization) {
        String uri = buildUri(path, queryParams);
        var spec = restClient.get()
                .uri(uri)
                .header("X-Request-ID", UUID.randomUUID().toString());
        
        if (authorization != null && !authorization.isBlank()) {
            spec.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        
        return spec.retrieve().body(JsonNode.class);
    }

    public JsonNode post(String path, Object body, String authorization) {
        var spec = restClient.post()
                .uri(path)
                .header("X-Request-ID", UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
        
        if (authorization != null && !authorization.isBlank()) {
            spec.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        
        return spec.retrieve().body(JsonNode.class);
    }

    private String buildUri(String path, Map<String, ?> queryParams) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromPath(path);
        queryParams.forEach((key, value) -> {
            if (value != null) {
                builder.queryParam(key, value);
            }
        });
        return builder.build(true).toUriString();
    }
}
