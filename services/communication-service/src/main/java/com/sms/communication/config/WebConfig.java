package com.sms.communication.config;

import com.sms.communication.security.TenantInterceptor;
import com.sms.communication.security.EntitlementInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final TenantInterceptor tenantInterceptor;
    private final EntitlementInterceptor entitlementInterceptor;

    public WebConfig(TenantInterceptor tenantInterceptor, EntitlementInterceptor entitlementInterceptor) {
        this.tenantInterceptor = tenantInterceptor;
        this.entitlementInterceptor = entitlementInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor);
        registry.addInterceptor(entitlementInterceptor);
    }
}
