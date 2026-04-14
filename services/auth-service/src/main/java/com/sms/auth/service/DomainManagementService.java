package com.sms.auth.service;

import com.sms.auth.domain.TenantDomainEntity;
import com.sms.auth.domain.TenantRoutingConfigEntity;
import com.sms.auth.repository.TenantDomainRepository;
import com.sms.auth.repository.TenantRoutingConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xbill.DNS.*;
import org.xbill.DNS.Record;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DomainManagementService {

    private static final Logger logger = LoggerFactory.getLogger(DomainManagementService.class);

    private final TenantDomainRepository tenantDomainRepository;
    private final TenantRoutingConfigRepository tenantRoutingConfigRepository;

    @Value("${app.platform-domain:platform.com}")
    private String platformDomain;

    public DomainManagementService(
            TenantDomainRepository tenantDomainRepository,
            TenantRoutingConfigRepository tenantRoutingConfigRepository
    ) {
        this.tenantDomainRepository = tenantDomainRepository;
        this.tenantRoutingConfigRepository = tenantRoutingConfigRepository;
    }

    @Transactional
    public TenantDomainEntity addCustomDomain(UUID tenantId, String domain, String verificationMethod) {
        // Validate domain format
        String normalizedDomain = normalizeDomain(domain);
        
        Optional<TenantDomainEntity> existing = tenantDomainRepository.findByDomainIgnoreCase(normalizedDomain);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Domain is already registered.");
        }

        TenantDomainEntity entity = new TenantDomainEntity();
        entity.setDomainId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setDomain(normalizedDomain);
        entity.setHost(normalizedDomain);
        entity.setDomainType("CUSTOM");
        entity.setVerificationMethod(verificationMethod != null ? verificationMethod : "DNS_TXT");
        entity.setVerificationToken("sms-verify-" + UUID.randomUUID().toString().substring(0, 16));
        entity.setVerificationStatus("PENDING");
        entity.setIsActive(false);
        entity.setSslMode("PLATFORM_MANAGED");
        entity.setSslStatus("PENDING");
        
        return tenantDomainRepository.save(entity);
    }

    @Transactional
    public TenantDomainEntity verifyDomain(UUID domainId) {
        TenantDomainEntity domain = tenantDomainRepository.findById(domainId)
                .orElseThrow(() -> new IllegalArgumentException("Domain not found."));

        boolean verified = performDnsCheck(domain);

        if (verified) {
            domain.setVerificationStatus("VERIFIED");
            domain.setIsActive(true);
            domain.setLastVerifiedAt(Instant.now());
            domain.setDnsStatus("ACTIVE");
            logger.info("Domain {} verified successfully.", domain.getDomain());
        } else {
            domain.setVerificationStatus("FAILED");
            domain.setDnsStatus("ERROR");
            logger.warn("Domain {} verification failed.", domain.getDomain());
        }

        domain.setLastDnsCheckAt(Instant.now());
        return tenantDomainRepository.save(domain);
    }

    private boolean performDnsCheck(TenantDomainEntity domain) {
        // Allow local development domains to pass DNS validation without external records.
        if (domain.getDomain().endsWith(".test") || domain.getDomain().contains("localhost")) {
            logger.info("Skipping DNS check for development domain: {}", domain.getDomain());
            return true;
        }

        try {
            // CNAME verification: check if it points to platform
            if ("DNS_CNAME".equals(domain.getVerificationMethod())) {
                Lookup lookup = new Lookup(domain.getDomain(), Type.CNAME);
                Record[] records = lookup.run();
                if (lookup.getResult() == Lookup.SUCCESSFUL && records != null && records.length > 0) {
                    CNAMERecord cname = (CNAMERecord) records[0];
                    String target = cname.getTarget().toString().toLowerCase();
                    // Canonical target should point to our platform
                    return target.endsWith(platformDomain.toLowerCase() + ".");
                }
            }

            // TXT verification: check _sms-verification.[domain]
            if ("DNS_TXT".equals(domain.getVerificationMethod())) {
                String verifyHost = "_sms-verification." + domain.getDomain();
                Lookup lookup = new Lookup(verifyHost, Type.TXT);
                Record[] records = lookup.run();
                if (lookup.getResult() == Lookup.SUCCESSFUL && records != null) {
                    for (Record r : records) {
                        TXTRecord txt = (TXTRecord) r;
                        for (Object str : txt.getStrings()) {
                            if (str.toString().contains(domain.getVerificationToken())) {
                                return true;
                            }
                        }
                    }
                }
            }
        } catch (TextParseException e) {
            logger.error("Failed to parse domain for DNS check: {}", domain.getDomain(), e);
        }

        return false;
    }

    @Transactional
    public void setPrimaryDomain(UUID tenantId, UUID domainId) {
        List<TenantDomainEntity> domains = tenantDomainRepository.findByTenantId(tenantId);
        
        TenantDomainEntity newPrimary = domains.stream()
                .filter(d -> d.getDomainId().equals(domainId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Domain not found for this tenant."));

        if (!"VERIFIED".equals(newPrimary.getVerificationStatus())) {
            throw new IllegalStateException("Only verified domains can be set as primary.");
        }

        domains.forEach(d -> {
            d.setIsPrimary(d.getDomainId().equals(domainId));
            d.setUpdatedAt(Instant.now());
        });

        tenantDomainRepository.saveAll(domains);

        // Update routing config
        TenantRoutingConfigEntity config = tenantRoutingConfigRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    TenantRoutingConfigEntity c = new TenantRoutingConfigEntity();
                    c.setConfigId(UUID.randomUUID());
                    c.setTenantId(tenantId);
                    return c;
                });
        
        config.setPreferredHost(newPrimary.getHost());
        config.setUpdatedAt(Instant.now());
        tenantRoutingConfigRepository.save(config);
    }

    private String normalizeDomain(String domain) {
        if (domain == null) return null;
        return domain.toLowerCase().trim().replaceAll("^https?://", "").replaceAll("/.*$", "");
    }
}
