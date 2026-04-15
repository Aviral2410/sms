package com.sms.auth.api;

import com.sms.auth.domain.TenantDomainEntity;
import com.sms.auth.domain.TenantEntity;
import com.sms.auth.domain.TenantRoutingConfigEntity;
import com.sms.auth.repository.TenantDomainRepository;
import com.sms.auth.repository.TenantRoutingConfigRepository;
import com.sms.auth.repository.TenantRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
public class TenantResolutionController {

    private final TenantDomainRepository tenantDomainRepository;
    private final TenantRepository tenantRepository;
    private final TenantRoutingConfigRepository tenantRoutingConfigRepository;

    public TenantResolutionController(
            TenantDomainRepository tenantDomainRepository,
            TenantRepository tenantRepository,
            TenantRoutingConfigRepository tenantRoutingConfigRepository
    ) {
        this.tenantDomainRepository = tenantDomainRepository;
        this.tenantRepository = tenantRepository;
        this.tenantRoutingConfigRepository = tenantRoutingConfigRepository;
    }

    /**
     * Resolves a tenant by the incoming host.
     * Host can be a platform subdomain (the realm name) or a custom domain.
     */
    @GetMapping("/public/tenant/resolve")
    public Map<String, Object> resolveTenant(@RequestParam String host) {
        Map<String, Object> result = new HashMap<>();
        
        // 1. Try custom domain / host match
        Optional<TenantDomainEntity> domain = tenantDomainRepository.findByHostIgnoreCase(host);
        UUID tenantId = null;

        if (domain.isPresent()) {
            TenantDomainEntity d = domain.get();
            if (d.getIsActive() && "VERIFIED".equals(d.getVerificationStatus())) {
                tenantId = d.getTenantId();
                result.put("tenantId", tenantId);
                result.put("host", d.getHost());
                result.put("type", d.getDomainType());
            }
        }

        // 2. Try platform subdomain match (realmName or schoolCode)
        if (tenantId == null) {
            String subdomain = host.split("\\.")[0];
            Optional<TenantEntity> tenant = tenantRepository.findByRealmNameIgnoreCase(subdomain);
            
            // Fallback to schoolCode if realmName doesn't match
            if (tenant.isEmpty()) {
                tenant = tenantRepository.findBySchoolCodeIgnoreCase(subdomain);
            }

            if (tenant.isPresent()) {
                tenantId = tenant.get().getTenantId();
                result.put("tenantId", tenantId);
                result.put("realmName", tenant.get().getRealmName());
                result.put("schoolCode", tenant.get().getSchoolCode());
                result.put("type", "PLATFORM_SUBDOMAIN");
            }
        }

        if (tenantId != null) {
            // Check for Canonical Redirect
            Optional<TenantRoutingConfigEntity> config = tenantRoutingConfigRepository.findByTenantId(tenantId);
            if (config.isPresent()) {
                String preferredHost = config.get().getPreferredHost();
                if (preferredHost != null && !preferredHost.equalsIgnoreCase(host)) {
                    // Only redirect if it's NOT a localhost/dev domain (configurable in prod)
                    if (!host.contains("localhost") && !"NONE".equals(config.get().getRedirectMode())) {
                        result.put("redirectUrl", preferredHost);
                    }
                }
            }
            return result;
        }

        return Map.of("error", "Tenant not found for host: " + host);
    }
}
