package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ToolArgumentValidationServiceTest {
    private final ToolArgumentValidationService service = new ToolArgumentValidationService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void validatesAttendanceDateRange() {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("fromDate", "2026-04-01");
        args.put("toDate", "2026-04-30");
        assertDoesNotThrow(() -> service.validate("getAttendanceReport", args));
    }

    @Test
    void rejectsAttendanceWhenFromDateAfterToDate() {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("fromDate", "2026-04-30");
        args.put("toDate", "2026-04-01");
        assertThrows(IllegalArgumentException.class, () -> service.validate("getAttendanceReport", args));
    }

    @Test
    void validatesNotificationRequiredFields() {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("recipientUserId", "76f8f9be-b74e-4f4a-a1f8-a57e7bd8de1a");
        args.put("message", "Parents meeting reminder");
        assertDoesNotThrow(() -> service.validate("sendNotification", args));
    }

    @Test
    void rejectsNotificationMissingRecipient() {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("message", "Reminder");
        assertThrows(IllegalArgumentException.class, () -> service.validate("sendNotification", args));
    }

    @Test
    void validatesCreateAnnouncement() {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("title", "PTM Reminder");
        args.put("content", "Parent teacher meeting at 10 AM.");
        args.put("targetAudience", "PARENT");
        assertDoesNotThrow(() -> service.validate("createAnnouncement", args));
    }

    @Test
    void rejectsCreateLeaveRequestInvalidRange() {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("leaveType", "SICK");
        args.put("startDate", "2026-05-20");
        args.put("endDate", "2026-05-18");
        assertThrows(IllegalArgumentException.class, () -> service.validate("createLeaveRequest", args));
    }

    @Test
    void validatesReviewLeaveRequest() {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("leaveRequestId", "76f8f9be-b74e-4f4a-a1f8-a57e7bd8de1a");
        args.put("decision", "approve");
        args.put("note", "Approved");
        assertDoesNotThrow(() -> service.validate("reviewLeaveRequest", args));
    }
}
