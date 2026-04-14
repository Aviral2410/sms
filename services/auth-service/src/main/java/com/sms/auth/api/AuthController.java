package com.sms.auth.api;

import com.sms.auth.service.AccountActivationService;
import com.sms.auth.service.AdminAuthService;
import com.sms.auth.service.PasswordResetService;
import com.sms.auth.service.PublicJoinService;
import com.sms.auth.service.SchoolAuthService;
import com.sms.auth.service.SchoolProvisioningService;
import com.sms.auth.event.MqttEventPublisher;
import static com.sms.auth.api.PublicAuthDtos.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Authentication, activation, account recovery, and internal provisioning APIs.")
public class AuthController {

    private final AdminAuthService adminAuthService;
    private final SchoolAuthService schoolAuthService;
    private final SchoolProvisioningService schoolProvisioningService;
    private final AccountActivationService accountActivationService;
    private final MqttEventPublisher mqttEventPublisher;
    private final PasswordResetService passwordResetService;
    private final PublicJoinService publicJoinService;

    public AuthController(
            AdminAuthService adminAuthService,
            SchoolAuthService schoolAuthService,
            SchoolProvisioningService schoolProvisioningService,
            AccountActivationService accountActivationService,
            MqttEventPublisher mqttEventPublisher,
            PasswordResetService passwordResetService,
            PublicJoinService publicJoinService
    ) {
        this.adminAuthService = adminAuthService;
        this.schoolAuthService = schoolAuthService;
        this.schoolProvisioningService = schoolProvisioningService;
        this.accountActivationService = accountActivationService;
        this.mqttEventPublisher = mqttEventPublisher;
        this.passwordResetService = passwordResetService;
        this.publicJoinService = publicJoinService;
    }

    private void checkAdminRole(String role) {
        if (role == null || (!role.equals("PLATFORM_ADMIN") && !role.equals("SUPER_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Requires Platform Admin role");
        }
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "service", "auth-service",
                "status", "UP",
                "capabilities", new String[]{"jwt-issuance", "tenant-authz", "role-management"}
        );
    }

    @PostMapping("/admin/login")
    public AdminLoginResponse login(@Valid @RequestBody AdminLoginRequest request) {
        return adminAuthService.login(request);
    }

    @PostMapping("/school/login")
    public SchoolLoginResponse schoolLogin(@Valid @RequestBody SchoolLoginRequest request) {
        return schoolAuthService.login(request);
    }

    @PostMapping("/school/activate")
    public SchoolActivationResponse activateSchoolAccount(@Valid @RequestBody SchoolActivationRequest request) {
        return accountActivationService.activate(request);
    }

    // -- Public: Password reset ------------------------------------------------

    @PostMapping("/public/password/forgot")
    public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.requestReset(request);
    }

    @PostMapping("/public/password/verify-code")
    public VerifyResetCodeResponse verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        return passwordResetService.verifyCode(request);
    }

    @PostMapping("/public/password/reset")
    public ForgotPasswordResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return passwordResetService.resetPassword(request);
    }

    // -- Public: Join with code ------------------------------------------------

    @PostMapping("/public/join")
    public JoinSchoolPublicResponse joinSchool(@Valid @RequestBody JoinSchoolPublicRequest request) {
        return publicJoinService.join(request);
    }

    @GetMapping("/admin/activation-details")
    public ActivationDetailsResponse getActivationDetails(
            @RequestParam String schoolCode, 
            @RequestParam String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        return accountActivationService.getActiveActivationDetails(schoolCode, email);
    }

    @PostMapping("/admin/activation-regenerate")
    public ActivationDetailsResponse regenerateActivationCode(
            @RequestParam String schoolCode, 
            @RequestParam String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        return accountActivationService.regenerateSchoolAdminActivationCode(schoolCode, email);
    }

    @PostMapping("/internal/provision-school")
    public ProvisionSchoolResponse provisionSchool(
            @Valid @RequestBody ProvisionSchoolRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        ProvisionSchoolResponse response = schoolProvisioningService.provision(request);
        mqttEventPublisher.publish("platform/logs/auth", Map.of(
            "message", "Successfully provisioned school: " + request.schoolName(),
            "level", "info",
            "service", "auth-service",
            "details", response
        ));
        return response;
    }

    @PostMapping("/internal/provision-user")
    public ProvisionUserAccountResponse provisionUser(
            @Valid @RequestBody ProvisionUserAccountRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        // Both Platform Admin and School Admin can provision users (e.g. teachers)
        if (role == null || (!role.equals("PLATFORM_ADMIN") && !role.equals("SUPER_ADMIN") && !role.equals("SCHOOL_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Requires Admin role");
        }
        
        ProvisionUserAccountResponse response = schoolProvisioningService.provisionTenantUser(request);
        mqttEventPublisher.publish("platform/logs/auth", Map.of(
            "message", "Provisioned user account: " + request.email(),
            "level", "info",
            "service", "auth-service"
        ));
        return response;
    }

    @PatchMapping("/internal/user-preferences")
    public void updateUserPreferences(@RequestParam String email, @Valid @RequestBody UserPreferencesRequest request) {
        // Preferences should generally be allow for the user themselves, 
        // but since we don't have token-email validation yet, we allow it.
        schoolProvisioningService.updateUserPreferences(email, request);
    }

    @PatchMapping("/admin/profile")
    public Map<String, String> updateAdminProfile(
            @RequestParam String email, 
            @Valid @RequestBody UpdateUserRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        adminAuthService.updateProfile(email, request);
        return Map.of("status", "updated", "email", email);
    }
}
