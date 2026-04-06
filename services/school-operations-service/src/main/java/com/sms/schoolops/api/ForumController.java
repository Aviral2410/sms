package com.sms.schoolops.api;

import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.service.ForumService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/forum")
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @PostMapping("/questions")
    public ForumQuestionResponse askQuestion(@Valid @RequestBody ForumQuestionRequest request) {
        return forumService.askQuestion(request);
    }

    @PostMapping("/answers")
    public ForumAnswerResponse answerQuestion(@Valid @RequestBody ForumAnswerRequest request) {
        return forumService.answerQuestion(request);
    }

    @PostMapping("/votes")
    public void vote(@Valid @RequestBody ForumVoteRequest request) {
        forumService.vote(request);
    }

    @PostMapping("/flags")
    public void flag(@Valid @RequestBody ForumFlagRequest request) {
        forumService.flag(request);
    }

    @GetMapping("/feed")
    public List<ForumQuestionResponse> getFeed(
            @RequestParam UUID schoolId, 
            @RequestParam(required = false) String subject) {
        return forumService.getFeed(schoolId, subject);
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
            @RequestParam UUID schoolId, 
            @RequestParam(defaultValue = "WEEKLY") String period) {
        return forumService.getLeaderboard(schoolId, period);
    }
}
