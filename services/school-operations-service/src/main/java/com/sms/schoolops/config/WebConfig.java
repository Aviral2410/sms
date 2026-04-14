package com.sms.schoolops.config;

import com.sms.schoolops.security.TenantInterceptor;
import com.sms.schoolops.security.EntitlementInterceptor;
import com.sms.schoolops.security.ScopeEnforcementInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final TenantInterceptor tenantInterceptor;
    private final EntitlementInterceptor entitlementInterceptor;
    private final ScopeEnforcementInterceptor scopeEnforcementInterceptor;

    public WebConfig(TenantInterceptor tenantInterceptor, EntitlementInterceptor entitlementInterceptor, ScopeEnforcementInterceptor scopeEnforcementInterceptor) {
        this.tenantInterceptor = tenantInterceptor;
        this.entitlementInterceptor = entitlementInterceptor;
        this.scopeEnforcementInterceptor = scopeEnforcementInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor);
        registry.addInterceptor(scopeEnforcementInterceptor);
        registry.addInterceptor(entitlementInterceptor);
    }
}
