package com.sms.communication.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.common.exception.NotFoundException;
import com.sms.communication.api.CommunicationDtos.AnnouncementAckResponse;
import com.sms.communication.api.CommunicationDtos.AnnouncementCreateRequest;
import com.sms.communication.api.CommunicationDtos.AnnouncementResponse;
import com.sms.communication.domain.AnnouncementAckEntity;
import com.sms.communication.domain.AnnouncementEntity;
import com.sms.communication.repository.AnnouncementAckRepository;
import com.sms.communication.repository.AnnouncementRepository;
import com.sms.communication.security.SchoolContext;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnnouncementService {
    private static final Logger logger = LoggerFactory.getLogger(AnnouncementService.class);

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementAckRepository ackRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository, AnnouncementAckRepository ackRepository) {
        this.announcementRepository = announcementRepository;
        this.ackRepository = ackRepository;
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(CommunicationActor actor, AnnouncementCreateRequest request) {
        requireActor(actor);
        if (!canPublishAnnouncement(actor.roleName())) {
            throw new ForbiddenException("Only admin, teacher, or staff roles can publish announcements.");
        }
        UUID schoolId = actor.schoolId();
        Instant now = Instant.now();

        AnnouncementEntity entity = new AnnouncementEntity();
        entity.setAnnouncementId(UUID.randomUUID());
        entity.setSchoolId(schoolId);
        entity.setTitle(request.title().trim());
        entity.setContent(request.content().trim());
        entity.setTargetAudience(normalizeAudience(request.targetAudience()));
        entity.setTargetClassId(request.targetClassId());
        entity.setCreatedBy(actor.userId());
        entity.setPublishedAt(request.publishedAt() == null ? now : request.publishedAt());
        entity.setCreatedAt(now);
        entity.setExpiresAt(request.expiresAt());
        entity.setPriority(request.priority() == null || request.priority().isBlank() ? "NORMAL" : request.priority().trim().toUpperCase(Locale.ROOT));
        entity.setType(request.type() == null || request.type().isBlank() ? "ANNOUNCEMENT" : request.type().trim().toUpperCase(Locale.ROOT));

        AnnouncementEntity saved = announcementRepository.save(entity);
        logger.info("Announcement published. schoolId={} announcementId={} audience={} classId={} type={} priority={}",
                schoolId, saved.getAnnouncementId(), saved.getTargetAudience(), saved.getTargetClassId(), saved.getType(), saved.getPriority());

        long ackCount = ackRepository.countBySchoolIdAndAnnouncementId(schoolId, saved.getAnnouncementId());
        return toResponse(saved, false, null, ackCount);
    }

    public List<AnnouncementResponse> listAnnouncements(CommunicationActor actor, UUID classId) {
        requireActor(actor);

        UUID schoolId = actor.schoolId();
        Set<String> audiences = audiencesForRole(actor.roleName());

        List<AnnouncementEntity> rows = classId != null
                ? announcementRepository.findFiltered(schoolId, audiences, classId)
                : announcementRepository.findBySchoolIdAndTargetAudienceInOrderByCreatedAtDesc(schoolId, audiences);

        return rows.stream().map(a -> {
            AnnouncementAckEntity ack = ackRepository.findBySchoolIdAndAnnouncementIdAndUserId(schoolId, a.getAnnouncementId(), actor.userId())
                    .orElse(null);
            long ackCount = ackRepository.countBySchoolIdAndAnnouncementId(schoolId, a.getAnnouncementId());
            return toResponse(a, ack != null, ack == null ? null : ack.getAcknowledgedAt(), ackCount);
        }).toList();
    }

    @Transactional
    public AnnouncementAckResponse acknowledge(CommunicationActor actor, UUID announcementId) {
        requireActor(actor);
        if (announcementId == null) throw new IllegalArgumentException("announcementId is required.");

        UUID schoolId = actor.schoolId();
        // Ensure announcement exists within school.
        AnnouncementEntity announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new NotFoundException("Announcement not found."));
        if (!schoolId.equals(announcement.getSchoolId())) {
            throw new ForbiddenException("Access denied.");
        }

        AnnouncementAckEntity existing = ackRepository.findBySchoolIdAndAnnouncementIdAndUserId(schoolId, announcementId, actor.userId()).orElse(null);
        if (existing != null) {
            return new AnnouncementAckResponse(announcementId, actor.userId(), existing.getAcknowledgedAt());
        }

        AnnouncementAckEntity ack = new AnnouncementAckEntity();
        ack.setAckId(UUID.randomUUID());
        ack.setSchoolId(schoolId);
        ack.setAnnouncementId(announcementId);
        ack.setUserId(actor.userId());
        ack.setAcknowledgedAt(Instant.now());
        ackRepository.save(ack);

        logger.info("Announcement acknowledged. schoolId={} announcementId={} userId={}", schoolId, announcementId, actor.userId());
        return new AnnouncementAckResponse(announcementId, actor.userId(), ack.getAcknowledgedAt());
    }

    public CommunicationActor resolveActor(String userIdHeader, String schoolIdHeader, String tenantIdHeader, String roleHeader) {
        // Reuse MessagingService parsing style but keep it local to avoid cross-service coupling.
        UUID userId = parseUuid(userIdHeader, "Missing or invalid X-User-ID header.");
        UUID schoolId = parseUuid(schoolIdHeader, "Missing or invalid X-School-ID header.");
        UUID tenantId = tenantIdHeader == null || tenantIdHeader.isBlank() ? null : safeParseUuid(tenantIdHeader.trim());
        String role = roleHeader == null ? "" : roleHeader.trim().toUpperCase(Locale.ROOT);
        return new CommunicationActor(tenantId, schoolId, userId, role);
    }

    private void requireActor(CommunicationActor actor) {
        if (actor == null) throw new IllegalArgumentException("Missing actor context.");
        if (actor.schoolId() == null) throw new IllegalArgumentException("Missing school context.");
        if (actor.userId() == null) throw new IllegalArgumentException("Missing user context.");
    }

    private UUID parseUuid(String raw, String error) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException(error);
        UUID parsed = safeParseUuid(raw.trim());
        if (parsed == null) throw new IllegalArgumentException(error);
        return parsed;
    }

    private UUID safeParseUuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String normalizeAudience(String audience) {
        String value = audience == null ? "" : audience.trim().toUpperCase(Locale.ROOT);
        if (value.isBlank()) return "ALL";
        return value;
    }

    private Set<String> audiencesForRole(String role) {
        Set<String> audiences = new java.util.HashSet<>();
        audiences.add("ALL");

        if (role == null) return audiences;
        String upperRole = role.toUpperCase(Locale.ROOT);

        if (upperRole.contains("ADMIN") || upperRole.contains("MANAGER") || upperRole.contains("PRINCIPAL")) audiences.add("STAFF");
        if (upperRole.contains("TEACHER")) audiences.add("TEACHERS");
        if (upperRole.contains("STUDENT")) audiences.add("STUDENTS");
        if (upperRole.contains("PARENT")) audiences.add("PARENTS");
        if (upperRole.contains("STAFF")) audiences.add("STAFF");

        return audiences;
    }

    private boolean canPublishAnnouncement(String role) {
        if (role == null || role.isBlank()) return false;
        String upperRole = role.toUpperCase(Locale.ROOT);
        return upperRole.contains("ADMIN")
                || upperRole.contains("TEACHER")
                || upperRole.contains("STAFF")
                || upperRole.contains("PRINCIPAL")
                || upperRole.contains("MANAGER");
    }

    private AnnouncementResponse toResponse(AnnouncementEntity entity, boolean acknowledged, Instant acknowledgedAt, long ackCount) {
        return new AnnouncementResponse(
                entity.getAnnouncementId(),
                entity.getSchoolId(),
                entity.getTitle(),
                entity.getContent(),
                entity.getTargetAudience(),
                entity.getTargetClassId(),
                entity.getCreatedBy(),
                entity.getPublishedAt() == null ? entity.getCreatedAt() : entity.getPublishedAt(),
                entity.getCreatedAt(),
                entity.getExpiresAt(),
                entity.getPriority(),
                entity.getType(),
                acknowledged,
                acknowledgedAt,
                ackCount
        );
    }
}
