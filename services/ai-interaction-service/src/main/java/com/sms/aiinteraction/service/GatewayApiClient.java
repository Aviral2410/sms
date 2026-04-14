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
        return restClient.get()
                .uri(uri)
                .header(HttpHeaders.AUTHORIZATION, authorization)
                .header("X-Request-ID", UUID.randomUUID().toString())
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode post(String path, Object body, String authorization) {
        return restClient.post()
                .uri(path)
                .header(HttpHeaders.AUTHORIZATION, authorization)
                .header("X-Request-ID", UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
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
