package com.sms.communication.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CommunicationDtos {

    public record AnnouncementCreateRequest(
            @NotBlank String title,
            @NotBlank String content,
            @NotBlank String targetAudience,
            UUID targetClassId,
            String priority,
            String type,
            Instant publishedAt,
            Instant expiresAt
    ) {}

    public record AnnouncementResponse(
            UUID announcementId,
            UUID schoolId,
            String title,
            String content,
            String targetAudience,
            UUID targetClassId,
            UUID createdBy,
            Instant publishedAt,
            Instant createdAt,
            Instant expiresAt,
            String priority,
            String type,
            boolean acknowledged,
            Instant acknowledgedAt,
            long ackCount
    ) {}

    public record AnnouncementAckResponse(
            UUID announcementId,
            UUID userId,
            Instant acknowledgedAt
    ) {}

    public record ThreadCreateRequest(
            String subject,
            @NotNull List<UUID> participantUserIds
    ) {}

    public record ThreadResponse(
            UUID threadId,
            UUID schoolId,
            String subject,
            UUID createdByUserId,
            Instant createdAt,
            Instant updatedAt,
            Instant lastMessageAt,
            List<UUID> participantUserIds,
            Long unreadCount,
            Instant lastReadAt
    ) {}

    public record MessageCreateRequest(
            @NotBlank String body
    ) {}

    public record MessageResponse(
            UUID messageId,
            UUID threadId,
            UUID schoolId,
            UUID senderUserId,
            String body,
            Instant createdAt
    ) {}

    public record ThreadReadResponse(
            UUID threadId,
            UUID userId,
            Instant lastReadAt
    ) {}
}
