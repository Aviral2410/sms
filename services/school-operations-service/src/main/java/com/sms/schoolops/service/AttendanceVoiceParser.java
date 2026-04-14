package com.sms.schoolops.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AttendanceVoiceParser {
    private static final Pattern COMMAND_PATTERN = Pattern.compile(
            "(?:roll|role)\\s*(\\d+)\\s*(present|absent|late|excused|leave|on leave|excuse(?:d)?)",
            Pattern.CASE_INSENSITIVE
    );

    public List<ParsedVoiceCommand> parseTranscript(String transcript) {
        List<ParsedVoiceCommand> results = new ArrayList<>();
        if (transcript == null || transcript.isBlank()) {
            return results;
        }

        String[] segments = transcript.split("(?i)(?:,|;|\\n|\\band\\b)");
        for (String rawSegment : segments) {
            String segment = rawSegment == null ? "" : rawSegment.trim();
            if (segment.isBlank()) {
                continue;
            }

            Matcher matcher = COMMAND_PATTERN.matcher(segment);
            if (!matcher.find()) {
                results.add(new ParsedVoiceCommand(null, null, segment, false, "Unrecognized command"));
                continue;
            }

            String rollNumber = matcher.group(1);
            String normalizedStatus = normalizeStatus(matcher.group(2));
            if (normalizedStatus == null) {
                results.add(new ParsedVoiceCommand(rollNumber, null, segment, false, "Unsupported status"));
                continue;
            }

            results.add(new ParsedVoiceCommand(rollNumber, normalizedStatus, segment, true, null));
        }

        return results;
    }

    private String normalizeStatus(String rawStatus) {
        String status = rawStatus == null ? "" : rawStatus.trim().toUpperCase(Locale.ROOT);
        return switch (status) {
            case "PRESENT" -> "PRESENT";
            case "ABSENT" -> "ABSENT";
            case "LATE" -> "LATE";
            case "EXCUSED", "EXCUSE", "LEAVE", "ON LEAVE" -> "EXCUSED";
            default -> null;
        };
    }

    public record ParsedVoiceCommand(
            String rollNumber,
            String attendanceStatus,
            String rawSegment,
            boolean valid,
            String failureReason
    ) {}
}
