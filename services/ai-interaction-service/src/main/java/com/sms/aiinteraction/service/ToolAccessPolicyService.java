package com.sms.aiinteraction.service;

import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.tool.AiTool;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ToolAccessPolicyService {
    private static final Set<String> PLATFORM_ADMIN_ALLOWED_TOOLS = Set.of(
            "getPlatformRoadmap",
            "getPlatformSchoolsOverview",
            "getPlatformVision",
            "getPlatformFaq",
            "getPlatformSecurityInfo",
            "getPublicPlatformInfo",
            "getSubscriptionPlans",
            "getOnboardingInfo",
            "getAdminHelp",
            "getAuthHelp",
            "getSupportInfo",
            "submitSupportTicket",
            "submitCreateWorkspace"
    );

    public boolean canDiscover(AiTool tool, UserContext user) {
        if (user.role() == UserRole.PLATFORM_ADMIN) {
            return PLATFORM_ADMIN_ALLOWED_TOOLS.contains(tool.name());
        }
        return tool.allowedRoles().contains(user.role());
    }

    public boolean canExecute(AiTool tool, UserContext user) {
        return canDiscover(tool, user);
    }
}
