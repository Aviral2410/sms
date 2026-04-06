package com.sms.communication.controller;

import com.sms.communication.domain.AnnouncementEntity;
import com.sms.communication.domain.NotificationEntity;
import com.sms.communication.service.CommunicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/communication")
public class CommunicationController {

    private final CommunicationService communicationService;

    public CommunicationController(CommunicationService communicationService) {
        this.communicationService = communicationService;
    }

    @PostMapping("/announcements")
    public ResponseEntity<AnnouncementEntity> createAnnouncement(@RequestBody AnnouncementEntity announcement) {
        return ResponseEntity.ok(communicationService.broadcastAnnouncement(announcement));
    }

    @GetMapping("/announcements")
    public List<AnnouncementEntity> getAnnouncements(
            @RequestParam(required = false) UUID schoolId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) UUID classId) {
        return communicationService.getFilteredAnnouncements(schoolId, role, classId);
    }


    @PostMapping("/notifications")
    public ResponseEntity<NotificationEntity> sendNotification(@RequestBody NotificationEntity notification) {
        return ResponseEntity.ok(communicationService.sendNotification(notification));
    }

    @GetMapping("/notifications/user/{userId}")
    public List<NotificationEntity> getUserNotifications(@PathVariable UUID userId) {
        return communicationService.getUserNotifications(userId);
    }

    @PostMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID notificationId) {
        communicationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }
}
