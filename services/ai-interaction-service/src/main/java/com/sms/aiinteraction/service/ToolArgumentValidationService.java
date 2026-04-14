package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ToolArgumentValidationService {
    public void validate(String toolName, ObjectNode args) {
        switch (toolName) {
            case "getAttendanceReport" -> validateAttendance(args);
            case "getFeeDefaulters", "getAnnouncements", "getHomeworkSummary", "getExamResultsSummary", "getTransportOverview",
                 "getSchoolDashboard", "getLibraryResources", "getMessageThreads", "getMyLeaveRequests" -> {
                // No required arguments for now.
            }
            case "getForumLeaderboard" -> validateForumLeaderboard(args);
            case "getLeaveRequests" -> validateLeaveRequests(args);
            case "getStudentPerformance" -> validateStudentPerformance(args);
            case "sendNotification" -> validateSendNotification(args);
            case "createAnnouncement" -> validateCreateAnnouncement(args);
            case "createLeaveRequest" -> validateCreateLeaveRequest(args);
            case "reviewLeaveRequest" -> validateReviewLeaveRequest(args);
            default -> throw new IllegalArgumentException("Unsupported tool.");
        }
    }

    private void validateAttendance(ObjectNode args) {
        String from = args.hasNonNull("fromDate") ? args.get("fromDate").asText() : null;
        String to = args.hasNonNull("toDate") ? args.get("toDate").asText() : null;
        if (from == null || to == null) {
            throw new IllegalArgumentException("fromDate and toDate are required.");
        }

        LocalDate fromDate = parseDate(from, "fromDate");
        LocalDate toDate = parseDate(to, "toDate");
        if (fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate cannot be after toDate.");
        }
    }

    private void validateStudentPerformance(ObjectNode args) {
        if (!args.hasNonNull("studentId")) {
            return;
        }
        parseUuid(args.get("studentId").asText(), "studentId");
    }

    private void validateSendNotification(ObjectNode args) {
        String recipientUserId = requiredText(args, "recipientUserId");
        parseUuid(recipientUserId, "recipientUserId");

        String message = requiredText(args, "message");
        if (message.length() > 1000) {
            throw new IllegalArgumentException("message exceeds 1000 characters.");
        }

        if (args.hasNonNull("title")) {
            String title = args.get("title").asText();
            if (title.length() > 120) {
                throw new IllegalArgumentException("title exceeds 120 characters.");
            }
        }

        if (args.hasNonNull("idempotencyKey")) {
            String key = args.get("idempotencyKey").asText();
            if (key.isBlank() || key.length() > 128) {
                throw new IllegalArgumentException("idempotencyKey must be 1-128 characters.");
            }
        }
    }

    private void validateForumLeaderboard(ObjectNode args) {
        if (!args.hasNonNull("period")) {
            return;
        }
        String period = args.get("period").asText("").trim().toUpperCase(Locale.ROOT);
        if (!period.equals("DAILY") && !period.equals("WEEKLY") && !period.equals("MONTHLY")) {
            throw new IllegalArgumentException("period must be DAILY, WEEKLY, or MONTHLY.");
        }
    }

    private void validateLeaveRequests(ObjectNode args) {
        if (!args.hasNonNull("status")) {
            return;
        }
        String status = args.get("status").asText("").trim().toUpperCase(Locale.ROOT);
        if (status.isBlank()) {
            throw new IllegalArgumentException("status cannot be blank.");
        }
    }

    private void validateCreateAnnouncement(ObjectNode args) {
        String title = requiredText(args, "title");
        String content = requiredText(args, "content");
        String targetAudience = requiredText(args, "targetAudience");

        if (title.length() > 180) {
            throw new IllegalArgumentException("title exceeds 180 characters.");
        }
        if (content.length() > 5000) {
            throw new IllegalArgumentException("content exceeds 5000 characters.");
        }
        if (targetAudience.length() > 60) {
            throw new IllegalArgumentException("targetAudience exceeds 60 characters.");
        }
        if (args.hasNonNull("targetClassId")) {
            parseUuid(args.get("targetClassId").asText(), "targetClassId");
        }
    }

    private void validateCreateLeaveRequest(ObjectNode args) {
        requiredText(args, "leaveType");
        LocalDate start = parseDate(requiredText(args, "startDate"), "startDate");
        LocalDate end = parseDate(requiredText(args, "endDate"), "endDate");
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("startDate cannot be after endDate.");
        }
        if (args.hasNonNull("reason")) {
            String reason = args.get("reason").asText("");
            if (reason.length() > 1000) {
                throw new IllegalArgumentException("reason exceeds 1000 characters.");
            }
        }
    }

    private void validateReviewLeaveRequest(ObjectNode args) {
        parseUuid(requiredText(args, "leaveRequestId"), "leaveRequestId");
        String decision = requiredText(args, "decision").toLowerCase(Locale.ROOT);
        if (!decision.equals("approve") && !decision.equals("reject")) {
            throw new IllegalArgumentException("decision must be approve or reject.");
        }
        String note = requiredText(args, "note");
        if (note.length() > 1000) {
            throw new IllegalArgumentException("note exceeds 1000 characters.");
        }
    }

    private String requiredText(ObjectNode args, String field) {
        if (!args.hasNonNull(field)) {
            throw new IllegalArgumentException(field + " is required.");
        }
        String value = args.get(field).asText();
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required.");
        }
        return value.trim();
    }

    private LocalDate parseDate(String value, String field) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Invalid " + field + " date.");
        }
    }

    private UUID parseUuid(String value, String field) {
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid " + field + ".");
        }
    }
}
