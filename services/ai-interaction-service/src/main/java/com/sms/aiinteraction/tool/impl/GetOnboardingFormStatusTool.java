package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class GetOnboardingFormStatusTool implements AiTool {
    private final ObjectMapper objectMapper;

    private static final String[] REQUIRED_FIELDS = {
        "schoolName", "schoolCode", "boardAffiliation", "contactPhone", 
        "contactEmail", "addressLine", "city", "state", "country", "postalCode"
    };

    public GetOnboardingFormStatusTool(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getOnboardingFormStatus";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode properties = schema.putObject("properties");
        ObjectNode data = properties.putObject("data");
        data.put("type", "object");
        data.put("description", "The partial JSON data collected so far from the user for school onboarding.");
        
        return new ToolDescriptor(
            name(),
            "Analyze the partially collected school onboarding data and identify what fields are still missing according to the platform requirements.",
            schema
        );
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PUBLIC_ANONYMOUS, UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN);
    }

    @Override
    public boolean cacheable() {
        return false;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        JsonNode dataNode = arguments.path("data");
        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode missing = result.putArray("missingFields");
        
        String nextField = null;
        String nextExplanation = null;

        for (String field : REQUIRED_FIELDS) {
            JsonNode val = dataNode.path(field);
            if (val.isMissingNode() || val.isNull() || (val.isTextual() && val.asText().isBlank())) {
                missing.add(field);
                if (nextField == null) {
                    nextField = field;
                    nextExplanation = getFieldExplanation(field);
                }
            }
        }

        result.put("isReady", missing.isEmpty());
        result.put("nextFieldToAsk", nextField);
        result.put("nextFieldDescription", nextExplanation);
        result.put("totalRequired", REQUIRED_FIELDS.length);
        result.put("collectedCount", REQUIRED_FIELDS.length - missing.size());

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("status", result, meta);
    }

    private String getFieldExplanation(String field) {
        return switch (field) {
            case "schoolName" -> "The official name of your educational institution.";
            case "schoolCode" -> "A unique short code for your school (e.g., GREEN-VALLEY-01).";
            case "boardAffiliation" -> "The academic board your school follows (e.g., CBSE, ICSE, IB, State Board).";
            case "contactPhone" -> "A valid phone number for administrative contact.";
            case "contactEmail" -> "The primary administrative email address.";
            case "addressLine" -> "Street address or campus location.";
            case "city" -> "The city where the campus is located.";
            case "state" -> "The state or province.";
            case "country" -> "The country of operation.";
            case "postalCode" -> "The area zip or postal code.";
            default -> "Required information for your school profile.";
        };
    }
}
