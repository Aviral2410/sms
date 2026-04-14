package com.sms.communication.controller;

import com.sms.communication.api.CommunicationDtos.AnnouncementAckResponse;
import com.sms.communication.api.CommunicationDtos.AnnouncementCreateRequest;
import com.sms.communication.api.CommunicationDtos.AnnouncementResponse;
import com.sms.communication.api.CommunicationDtos.MessageCreateRequest;
import com.sms.communication.api.CommunicationDtos.MessageResponse;
import com.sms.communication.api.CommunicationDtos.ThreadCreateRequest;
import com.sms.communication.api.CommunicationDtos.ThreadReadResponse;
import com.sms.communication.api.CommunicationDtos.ThreadResponse;
import com.sms.communication.domain.AnnouncementEntity;
import com.sms.communication.domain.NotificationEntity;
import com.sms.communication.service.AnnouncementService;
import com.sms.communication.service.CommunicationService;
import com.sms.communication.service.CommunicationActor;
import com.sms.communication.service.MessagingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/communication")
public class CommunicationController {

    private final CommunicationService communicationService;
    private final AnnouncementService announcementService;
    private final MessagingService messagingService;

    public CommunicationController(
            CommunicationService communicationService,
            AnnouncementService announcementService,
            MessagingService messagingService
    ) {
        this.communicationService = communicationService;
        this.announcementService = announcementService;
        this.messagingService = messagingService;
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

    @PostMapping("/announcements/v2")
    public ResponseEntity<AnnouncementResponse> createAnnouncementV2(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody AnnouncementCreateRequest request
    ) {
        CommunicationActor actor = announcementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return ResponseEntity.ok(announcementService.createAnnouncement(actor, request));
    }

    @GetMapping("/announcements/v2")
    public List<AnnouncementResponse> listAnnouncementsV2(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) UUID classId
    ) {
        CommunicationActor actor = announcementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return announcementService.listAnnouncements(actor, classId);
    }

    @PostMapping("/announcements/{announcementId}/ack")
    public ResponseEntity<AnnouncementAckResponse> acknowledgeAnnouncement(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID announcementId
    ) {
        CommunicationActor actor = announcementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return ResponseEntity.ok(announcementService.acknowledge(actor, announcementId));
    }

    @PostMapping("/messages/threads")
    public ResponseEntity<ThreadResponse> createThread(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody ThreadCreateRequest request
    ) {
        CommunicationActor actor = messagingService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return ResponseEntity.ok(messagingService.createThread(actor, request));
    }

    @GetMapping("/messages/threads")
    public List<ThreadResponse> listThreads(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        CommunicationActor actor = messagingService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return messagingService.listMyThreads(actor);
    }

    @GetMapping("/messages/threads/{threadId}")
    public List<MessageResponse> listMessages(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID threadId
    ) {
        CommunicationActor actor = messagingService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return messagingService.listMessages(actor, threadId);
    }

    @PostMapping("/messages/threads/{threadId}")
    public ResponseEntity<MessageResponse> sendMessage(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID threadId,
            @Valid @RequestBody MessageCreateRequest request
    ) {
        CommunicationActor actor = messagingService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return ResponseEntity.ok(messagingService.sendMessage(actor, threadId, request));
    }

    @PostMapping("/messages/threads/{threadId}/read")
    public ResponseEntity<ThreadReadResponse> markThreadRead(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID threadId
    ) {
        CommunicationActor actor = messagingService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, roleHeader);
        return ResponseEntity.ok(messagingService.markThreadRead(actor, threadId));
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
