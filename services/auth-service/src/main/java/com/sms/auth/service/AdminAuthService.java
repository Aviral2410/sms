package com.sms.auth.service;

import com.sms.auth.api.AdminLoginRequest;
import com.sms.auth.api.AdminLoginResponse;
import com.sms.auth.api.UpdateUserRequest;
import com.sms.auth.domain.AdminAccountEntity;
import com.sms.auth.repository.AdminAccountRepository;
import java.math.BigDecimal;
import java.util.UUID;
// InvalidAdminCredentialsException is in same package (com.sms.auth.service)
import org.springframework.stereotype.Service;

@Service
public class AdminAuthService {

    private final AdminAccountRepository adminAccountRepository;
    private final JwtUtil jwtUtil;

    public AdminAuthService(AdminAccountRepository adminAccountRepository, JwtUtil jwtUtil) {
        this.adminAccountRepository = adminAccountRepository;
        this.jwtUtil = jwtUtil;
    }

    public AdminLoginResponse login(AdminLoginRequest request) {
        AdminAccountEntity admin = adminAccountRepository.findByEmailIgnoreCaseAndActiveTrue(request.email())
                .filter(candidate -> candidate.getPassword().equals(request.password()))
                .orElseThrow(InvalidAdminCredentialsException::new);

        String token = jwtUtil.generateToken(
                UUID.nameUUIDFromBytes(admin.getEmail().getBytes()), // Generate a stable UUID from email since no UUID exists
                admin.getEmail(),
                admin.getRoleName(),
                admin.getTenantId(),
                null
        );

        return new AdminLoginResponse(
                admin.getEmail(),
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
