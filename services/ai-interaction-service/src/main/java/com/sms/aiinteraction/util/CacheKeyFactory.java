package com.sms.aiinteraction.util;

import com.sms.aiinteraction.security.UserContext;
import java.security.MessageDigest;
import java.util.Base64;

public class CacheKeyFactory {
    public static String forTool(UserContext userContext, String toolName, String arguments, String version) {
        try {
            String input = userContext.userId() + ":" + toolName + ":" + arguments + ":" + version;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return toolName + ":" + System.currentTimeMillis();
        }
    }
}
