package com.sms.communication.service;

import com.sms.communication.domain.AnnouncementEntity;
import com.sms.communication.domain.NotificationEntity;
import com.sms.communication.repository.AnnouncementRepository;
import com.sms.communication.repository.NotificationRepository;
import com.sms.communication.security.TenantContext;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CommunicationService {

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
            announcement.setSchoolId(UUID.fromString(TenantContext.getCurrentTenant()));
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
        
        // Potential for real-time notification dispatch here
        System.out.println("Broadcasted " + saved.getType() + " to " + saved.getTargetAudience() + " targeting class " + saved.getTargetClassId());
        
        return saved;
    }

    public List<AnnouncementEntity> getFilteredAnnouncements(UUID schoolId, String role, UUID classId) {
        if (schoolId == null) {
            schoolId = UUID.fromString(TenantContext.getCurrentTenant());
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
        notification.setSchoolId(UUID.fromString(TenantContext.getCurrentTenant()));
        notification.setCreatedAt(Instant.now());
        notification.setIsRead(false);
        
        // In a real system, here we would integrate with Twilio/Firebase/SendGrid
        System.out.println("Dispatching " + notification.getType() + " via " + notification.getChannel() + " to " + notification.getRecipientId());
        
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
