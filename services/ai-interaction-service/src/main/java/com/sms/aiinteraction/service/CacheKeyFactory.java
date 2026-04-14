package com.sms.aiinteraction.service;

import com.sms.aiinteraction.security.UserContext;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class CacheKeyFactory {
    private CacheKeyFactory() {}

    public static String forTool(UserContext user, String toolName, String payload, String version) {
        return String.join(":",
                "ai",
                user.tenantId().toString(),
                user.schoolId().toString(),
                user.role().name(),
                toolName,
                version,
                sha256(payload)
        );
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashed) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to compute SHA-256 hash.", e);
        }
    }
}
