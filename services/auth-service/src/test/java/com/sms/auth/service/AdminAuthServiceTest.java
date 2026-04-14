package com.sms.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.auth.api.AdminLoginRequest;
import com.sms.auth.api.AdminLoginResponse;
import com.sms.auth.domain.AdminAccountEntity;
import com.sms.auth.repository.AdminAccountRepository;
import com.sms.auth.security.PasswordService;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock
    private AdminAccountRepository adminAccountRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordService passwordService;

    @InjectMocks
    private AdminAuthService adminAuthService;

    @Test
    void loginReturnsStableUuidBackedUserIdForPlatformAdmin() {
        AdminLoginRequest request = new AdminLoginRequest("superadmin@sms.local", "change-me");

        AdminAccountEntity admin = new AdminAccountEntity();
        admin.setEmail("superadmin@sms.local");
        admin.setPassword("$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN");
        admin.setFullName("Platform Super Admin");
        admin.setRoleName("SUPER_ADMIN");
        admin.setTenantId(new UUID(0L, 0L));
        admin.setActive(true);

        UUID expectedUserId = UUID.nameUUIDFromBytes("superadmin@sms.local".getBytes(StandardCharsets.UTF_8));

        when(this.adminAccountRepository.findByEmailIgnoreCaseAndActiveTrue("superadmin@sms.local"))
                .thenReturn(Optional.of(admin));
        when(this.passwordService.matches("change-me", admin.getPassword())).thenReturn(true);
        when(this.passwordService.isBcryptHash(admin.getPassword())).thenReturn(true);
        when(this.jwtUtil.generateToken(expectedUserId, admin.getEmail(), admin.getRoleName(), admin.getTenantId(), null))
                .thenReturn("signed-jwt");

        AdminLoginResponse response = this.adminAuthService.login(request);

        assertThat(response.userId()).isEqualTo(expectedUserId.toString());
        assertThat(response.email()).isEqualTo("superadmin@sms.local");
        assertThat(response.role()).isEqualTo("SUPER_ADMIN");
        assertThat(response.token()).isEqualTo("signed-jwt");

        verify(this.jwtUtil).generateToken(expectedUserId, admin.getEmail(), admin.getRoleName(), admin.getTenantId(), null);
        verify(this.adminAccountRepository, never()).save(any());
    }
}
