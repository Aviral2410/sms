package com.sms.communication.service;

import com.sms.communication.domain.AnnouncementEntity;
import com.sms.communication.domain.NotificationEntity;
import com.sms.communication.repository.AnnouncementRepository;
import com.sms.communication.repository.NotificationRepository;
import com.sms.communication.security.SchoolContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CommunicationService {

    private static final Logger logger = LoggerFactory.getLogger(CommunicationService.class);

    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;

    public CommunicationService(AnnouncementRepository announcementRepository, NotificationRepository notificationRepository) {
        this.announcementRepository = announcementRepository;
        this.notificationRepository = notificationRepository;
    }

    public AnnouncementEntity broadcastAnnouncement(AnnouncementEntity announcement) {
        if (announcement.getAnnouncementId() == null) {
            announcement.setAnnouncementId(UUID.randomUUID());
        }
        if (announcement.getSchoolId() == null) {
            announcement.setSchoolId(UUID.fromString(SchoolContext.getCurrentSchoolId()));
        }
        if (announcement.getCreatedAt() == null) {
            announcement.setCreatedAt(Instant.now());
        }
        if (announcement.getPriority() == null) {
            announcement.setPriority("NORMAL");
        }
        if (announcement.getType() == null) {
            announcement.setType("ANNOUNCEMENT");
        }
        
        AnnouncementEntity saved = announcementRepository.save(announcement);
        
        // Announcement persistence is the source of truth for downstream delivery workers.
        logger.info("Broadcasted announcement. type={} targetAudience={} targetClassId={}", saved.getType(), saved.getTargetAudience(), saved.getTargetClassId());
        
        return saved;
    }

    public List<AnnouncementEntity> getFilteredAnnouncements(UUID schoolId, String role, UUID classId) {
        if (schoolId == null) {
            schoolId = UUID.fromString(SchoolContext.getCurrentSchoolId());
        }
        
        java.util.Set<String> audiences = new java.util.HashSet<>();
        audiences.add("ALL");
        
        if (role != null) {
            String upperRole = role.toUpperCase();
            if (upperRole.contains("ADMIN")) audiences.add("STAFF");
            if (upperRole.contains("TEACHER")) audiences.add("TEACHERS");
            if (upperRole.contains("STUDENT")) audiences.add("STUDENTS");
            if (upperRole.contains("PARENT")) audiences.add("PARENTS");
        }
        
        if (classId != null) {
            return announcementRepository.findFiltered(schoolId, audiences, classId);
        } else {
            return announcementRepository.findBySchoolIdAndTargetAudienceInOrderByCreatedAtDesc(schoolId, audiences);
        }
    }


    public NotificationEntity sendNotification(NotificationEntity notification) {
        if (notification.getNotificationId() == null) {
            notification.setNotificationId(UUID.randomUUID());
        }
        notification.setSchoolId(UUID.fromString(SchoolContext.getCurrentSchoolId()));
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(Instant.now());
        }
        if (notification.getIsRead() == null) {
            notification.setIsRead(false);
        }
        if (notification.getDeliveryStatus() == null || notification.getDeliveryStatus().isBlank()) {
            notification.setDeliveryStatus("PENDING");
        }
        if (notification.getProviderReference() == null || notification.getProviderReference().isBlank()) {
            notification.setProviderReference(null);
        }
        
        // Delivery orchestration is handled asynchronously by channel-specific workers.
        logger.info("Dispatching notification. type={} channel={} recipientId={}", notification.getType(), notification.getChannel(), notification.getRecipientId());
        
        return notificationRepository.save(notification);
    }

    public List<NotificationEntity> getUserNotifications(UUID userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }
}
