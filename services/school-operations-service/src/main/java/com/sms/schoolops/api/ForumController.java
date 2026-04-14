package com.sms.schoolops.api;

import com.sms.common.exception.ForbiddenException;
import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.service.ForumService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/school-ops/forum")
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    public record CreateQuestionRequest(
            @NotBlank String title,
            @NotBlank String content,
            String subject
    ) {}

    public record CreateAnswerRequest(
            @NotNull UUID questionId,
            @NotBlank String content
    ) {}

    public record VoteRequest(
            @NotNull UUID targetId,
            @NotNull Integer voteType
    ) {}

    public record FlagRequest(
            @NotNull UUID targetId,
            @NotBlank String reason
    ) {}

    @PostMapping("/questions")
    public ForumQuestionResponse askQuestion(
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader("X-User-ID") String userIdHeader,
            @Valid @RequestBody CreateQuestionRequest request
    ) {
        UUID schoolId = parseUuidHeader(schoolIdHeader, "Missing or invalid X-School-ID header.");
        UUID userId = parseUuidHeader(userIdHeader, "Missing or invalid X-User-ID header.");

        ForumQuestionRequest sanitized = new ForumQuestionRequest(
                schoolId,
                userId,
                "IGNORED",
                request.title(),
                request.content(),
                request.subject()
        );
        return forumService.askQuestion(sanitized);
    }

    @PostMapping("/answers")
    public ForumAnswerResponse answerQuestion(
            @RequestHeader("X-User-ID") String userIdHeader,
            @Valid @RequestBody CreateAnswerRequest request
    ) {
        UUID userId = parseUuidHeader(userIdHeader, "Missing or invalid X-User-ID header.");

        ForumAnswerRequest sanitized = new ForumAnswerRequest(
                request.questionId(),
                userId,
                "IGNORED",
                request.content()
        );
        return forumService.answerQuestion(sanitized);
    }

    @PostMapping("/votes")
    public void vote(
            @RequestHeader("X-User-ID") String userIdHeader,
            @Valid @RequestBody VoteRequest request
    ) {
        UUID userId = parseUuidHeader(userIdHeader, "Missing or invalid X-User-ID header.");
        ForumVoteRequest sanitized = new ForumVoteRequest(request.targetId(), userId, request.voteType());
        forumService.vote(sanitized);
    }

    @PostMapping("/flags")
    public void flag(
            @RequestHeader("X-User-ID") String userIdHeader,
            @Valid @RequestBody FlagRequest request
    ) {
        UUID userId = parseUuidHeader(userIdHeader, "Missing or invalid X-User-ID header.");
        ForumFlagRequest sanitized = new ForumFlagRequest(request.targetId(), userId, request.reason());
        forumService.flag(sanitized);
    }

    @GetMapping("/feed")
    public List<ForumQuestionResponse> getFeed(
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestParam(required = false) UUID schoolId,
            @RequestParam(required = false) String subject) {
        UUID headerSchoolId = parseUuidHeader(schoolIdHeader, "Missing or invalid X-School-ID header.");
        if (schoolId != null && !schoolId.equals(headerSchoolId)) {
            throw new ForbiddenException("Access denied for the requested school.");
        }
        return forumService.getFeed(headerSchoolId, subject);
    }

    @GetMapping("/questions/{questionId}/answers")
    public List<ForumAnswerResponse> getAnswers(@PathVariable UUID questionId) {
        return forumService.getAnswers(questionId);
    }

    @PatchMapping("/answers/{answerId}/correct")
    public void markCorrect(@PathVariable UUID answerId) {
        forumService.markCorrect(answerId);
    }

    @GetMapping("/leaderboard")
    public ForumLeaderboardResponse getLeaderboard(
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestParam(required = false) UUID schoolId,
            @RequestParam(defaultValue = "WEEKLY") String period) {
        UUID headerSchoolId = parseUuidHeader(schoolIdHeader, "Missing or invalid X-School-ID header.");
        if (schoolId != null && !schoolId.equals(headerSchoolId)) {
            throw new ForbiddenException("Access denied for the requested school.");
        }
        return forumService.getLeaderboard(headerSchoolId, period);
    }

    private static UUID parseUuidHeader(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(message);
        }
    }
}
