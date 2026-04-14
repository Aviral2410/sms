package com.sms.auth.api;

import com.sms.auth.domain.TenantDomainEntity;
import com.sms.auth.service.DomainManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/admin/routing")
public class RoutingAdminController {

    private final DomainManagementService domainManagementService;

    public RoutingAdminController(DomainManagementService domainManagementService) {
        this.domainManagementService = domainManagementService;
    }

    @PostMapping("/domains")
    public ResponseEntity<TenantDomainEntity> addDomain(
            @RequestParam UUID tenantId,
            @RequestBody AddDomainRequest request
    ) {
        TenantDomainEntity domain = domainManagementService.addCustomDomain(
                tenantId,
                request.domain(),
                request.verificationMethod()
        );
        return ResponseEntity.ok(domain);
    }

    @PostMapping("/domains/{domainId}/verify")
    public ResponseEntity<TenantDomainEntity> verifyDomain(@PathVariable UUID domainId) {
        TenantDomainEntity domain = domainManagementService.verifyDomain(domainId);
        return ResponseEntity.ok(domain);
    }

    @PostMapping("/domains/{domainId}/set-primary")
    public ResponseEntity<Void> setPrimary(@RequestParam UUID tenantId, @PathVariable UUID domainId) {
        domainManagementService.setPrimaryDomain(tenantId, domainId);
        return ResponseEntity.ok().build();
    }

    public record AddDomainRequest(String domain, String verificationMethod) {}
}
