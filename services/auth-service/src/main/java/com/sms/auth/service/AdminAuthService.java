package com.sms.auth.service;

import com.sms.auth.api.AdminLoginRequest;
import com.sms.auth.api.AdminLoginResponse;
import com.sms.auth.api.UpdateUserRequest;
import com.sms.auth.domain.AdminAccountEntity;
import com.sms.auth.repository.AdminAccountRepository;
import com.sms.auth.security.PasswordService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
// InvalidAdminCredentialsException is in same package (com.sms.auth.service)
import org.springframework.stereotype.Service;

@Service
public class AdminAuthService {

    private final AdminAccountRepository adminAccountRepository;
    private final JwtUtil jwtUtil;
    private final PasswordService passwordService;

    public AdminAuthService(AdminAccountRepository adminAccountRepository, JwtUtil jwtUtil, PasswordService passwordService) {
        this.adminAccountRepository = adminAccountRepository;
        this.jwtUtil = jwtUtil;
        this.passwordService = passwordService;
    }

    public AdminLoginResponse login(AdminLoginRequest request) {
        AdminAccountEntity admin = adminAccountRepository.findByEmailIgnoreCaseAndActiveTrue(request.email())
                .filter(candidate -> passwordService.matches(request.password(), candidate.getPassword()))
                .orElseThrow(InvalidAdminCredentialsException::new);

        UUID adminUserId = UUID.nameUUIDFromBytes(admin.getEmail().trim().toLowerCase().getBytes(StandardCharsets.UTF_8));

        // Opportunistic upgrade: if legacy plaintext password matched, replace with bcrypt hash.
        if (!passwordService.isBcryptHash(admin.getPassword())) {
            admin.setPassword(passwordService.hash(request.password()));
            adminAccountRepository.save(admin);
        }

        String token = jwtUtil.generateToken(
                adminUserId,
                admin.getEmail(),
                admin.getRoleName(),
                admin.getTenantId(),
                null
        );

        return new AdminLoginResponse(
                adminUserId.toString(),
                admin.getEmail(),
                admin.getFullName(),
                admin.getRoleName(),
                admin.getTheme(),
                admin.getActiveTheme(),
                admin.getVibe(),
                admin.getAccentColor(),
                admin.getGlassIntensity() != null ? admin.getGlassIntensity().doubleValue() : null,
                admin.getBorderRadius(),
                token
        );
    }

    public void updateProfile(String currentEmail, UpdateUserRequest request) {
        AdminAccountEntity admin = adminAccountRepository.findByEmailIgnoreCaseAndActiveTrue(currentEmail)
                .orElseThrow(() -> new IllegalArgumentException("Admin account not found: " + currentEmail));

        // SECURITY VALIDATION: PLATFORM_ADMIN emails must not be editable
        boolean isPlatformAdmin = "PLATFORM_ADMIN".equalsIgnoreCase(admin.getRoleName()) || 
                                 "SUPER_ADMIN".equalsIgnoreCase(admin.getRoleName());
        
        if (isPlatformAdmin && request.email() != null && !request.email().equalsIgnoreCase(currentEmail)) {
            throw new IllegalArgumentException("Platform Admin email cannot be modified for security reasons.");
        }

        if (request.fullName() != null && !request.fullName().isBlank()) {
            admin.setFullName(request.fullName());
        }

        // Update preferences if provided
        if (request.theme() != null) admin.setTheme(request.theme());
        if (request.activeTheme() != null) admin.setActiveTheme(request.activeTheme());
        if (request.vibe() != null) admin.setVibe(request.vibe());
        if (request.accentColor() != null) admin.setAccentColor(request.accentColor());
        if (request.glassIntensity() != null) admin.setGlassIntensity(BigDecimal.valueOf(request.glassIntensity()));
        if (request.borderRadius() != null) admin.setBorderRadius(request.borderRadius());
        
        adminAccountRepository.save(admin);
    }
}
