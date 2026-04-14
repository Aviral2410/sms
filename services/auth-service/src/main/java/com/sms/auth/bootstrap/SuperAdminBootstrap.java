package com.sms.auth.bootstrap;

import com.sms.auth.domain.AdminAccountEntity;
import com.sms.auth.repository.AdminAccountRepository;
import com.sms.auth.security.PasswordService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SuperAdminBootstrap implements ApplicationRunner {
    private static final Logger logger = LoggerFactory.getLogger(SuperAdminBootstrap.class);

    private final AdminAccountRepository adminAccountRepository;
    private final PasswordService passwordService;

    private final boolean enabled;
    private final String email;
    private final String password;
    private final String fullName;

    public SuperAdminBootstrap(
            AdminAccountRepository adminAccountRepository,
            PasswordService passwordService,
            @Value("${app.bootstrap.superadmin.enabled:false}") boolean enabled,
            @Value("${app.bootstrap.superadmin.email:}") String email,
            @Value("${app.bootstrap.superadmin.password:}") String password,
            @Value("${app.bootstrap.superadmin.full-name:Platform Super Admin}") String fullName
    ) {
        this.adminAccountRepository = adminAccountRepository;
        this.passwordService = passwordService;
        this.enabled = enabled;
        this.email = email == null ? "" : email.trim();
        this.password = password == null ? "" : password;
        this.fullName = fullName == null ? "Platform Super Admin" : fullName.trim();
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        if (email.isBlank() || password.isBlank()) {
            logger.warn("SuperAdmin bootstrap enabled but missing email/password; skipping. Configure app.bootstrap.superadmin.email and app.bootstrap.superadmin.password.");
            return;
        }

        if (adminAccountRepository.findByEmailIgnoreCaseAndActiveTrue(email).isPresent()) {
            logger.info("SuperAdmin already present: {}", email);
            return;
        }

        AdminAccountEntity admin = new AdminAccountEntity();
        admin.setEmail(email);
        admin.setTenantId(new UUID(0L, 0L));
        admin.setPassword(passwordService.hash(password));
        admin.setFullName(fullName);
        admin.setRoleName("SUPER_ADMIN");
        admin.setActive(true);
        adminAccountRepository.save(admin);
        logger.info("Bootstrapped SUPER_ADMIN account: {}", email);
    }
}
