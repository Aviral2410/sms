package com.sms.auth.api;

import java.util.UUID;

public record ProvisionUserAccountResponse(
        UUID accountId,
        String schoolCode,
        String email,
        String fullName,
        String roleName
) {
}
