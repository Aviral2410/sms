package com.sms.communication.service;

import java.util.UUID;

public record CommunicationActor(
        UUID tenantId,
        UUID schoolId,
        UUID userId,
        String roleName
) {}

