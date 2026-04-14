package com.sms.schoolops.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.domain.*;
import com.sms.schoolops.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ForumService {

    private final ForumQuestionRepository questionRepository;
    private final ForumAnswerRepository answerRepository;
    private final ForumVoteRepository voteRepository;
    private final ForumFlagRepository flagRepository;
    private final ForumPointLogRepository pointLogRepository;
    private final ModerationService moderationService;
    private final SchoolUserRepository userRepository;

    public ForumService(
            ForumQuestionRepository questionRepository,
            ForumAnswerRepository answerRepository,
            ForumVoteRepository voteRepository,
            ForumFlagRepository flagRepository,
            ForumPointLogRepository pointLogRepository,
            ModerationService moderationService,
            SchoolUserRepository userRepository) {
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.voteRepository = voteRepository;
        this.flagRepository = flagRepository;
        this.pointLogRepository = pointLogRepository;
        this.moderationService = moderationService;
        this.userRepository = userRepository;
    }

    @Transactional
    public ForumQuestionResponse askQuestion(ForumQuestionRequest request) {
        SchoolUserEntity actor = requireActiveActorInSchool(request.authorId(), request.schoolId());
        ModerationService.ModerationResult mod = moderationService.moderate(request.title(), request.content());

        ForumQuestionEntity entity = new ForumQuestionEntity();
        entity.setQuestionId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setAuthorId(request.authorId());
        // Do not trust UI-provided authorName; derive from the authenticated user profile.
        entity.setAuthorName(actor.getFullName());
        entity.setTitle(request.title());
        entity.setContent(request.content());
        entity.setSubject(request.subject());
        entity.setStatus(mod.approved() ? "APPROVED" : "BLOCKED");
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());

        ForumQuestionEntity saved = questionRepository.save(entity);
        return toQuestionResponse(saved);
    }

    @Transactional
    public ForumAnswerResponse answerQuestion(ForumAnswerRequest request) {
        // Ensure the actor exists and belongs to the current school context.
        // This prevents cross-school impersonation via client-provided IDs.
        UUID schoolId = questionRepository.findById(request.questionId())
                .map(ForumQuestionEntity::getSchoolId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found."));

        SchoolUserEntity actor = requireActiveActorInSchool(request.authorId(), schoolId);
        ModerationService.ModerationResult mod = moderationService.moderate(null, request.content());

        ForumAnswerEntity entity = new ForumAnswerEntity();
        entity.setAnswerId(UUID.randomUUID());
        entity.setQuestionId(request.questionId());
        entity.setAuthorId(request.authorId());
        entity.setAuthorName(actor.getFullName());
        entity.setContent(request.content());
        entity.setStatus(mod.approved() ? "APPROVED" : "BLOCKED");
        entity.setCreatedAt(Instant.now());

        ForumAnswerEntity saved = answerRepository.save(entity);

        if (mod.approved()) {
            awardPoints(request.authorId(), saved.getAnswerId(), "ANSWER", 5);
        }

        return toAnswerResponse(saved);
    }

    @Transactional
    public void vote(ForumVoteRequest request) {
        // Require voter to be a real user. School membership will be checked when we resolve the target.
        requireActiveActor(request.voterId());

        voteRepository.findByTargetIdAndVoterId(request.targetId(), request.voterId())
                .ifPresentOrElse(
                    v -> { v.setVoteType(request.voteType()); voteRepository.save(v); },
                    () -> {
                        ForumVoteEntity v = new ForumVoteEntity();
                        v.setVoteId(UUID.randomUUID());
                        v.setTargetId(request.targetId());
                        v.setVoterId(request.voterId());
                        v.setVoteType(request.voteType());
                        voteRepository.save(v);
                    }
                );
        
        if (request.targetId() != null) {
            questionRepository.findById(request.targetId()).ifPresent(q -> {
                // Ensure voter belongs to the same school as the target content.
                requireActiveActorInSchool(request.voterId(), q.getSchoolId());
                if (request.voteType() > 0) {
                    q.setUpvotes(q.getUpvotes() + 1);
                    questionRepository.save(q);
                    awardPoints(q.getAuthorId(), q.getQuestionId(), "UPVOTE", 2);
                }
            });

            answerRepository.findById(request.targetId()).ifPresent(a -> {
                ForumQuestionEntity question = questionRepository.findById(a.getQuestionId()).orElse(null);
                if (question != null) {
                    requireActiveActorInSchool(request.voterId(), question.getSchoolId());
                }
                if (request.voteType() > 0) {
                    a.setUpvotes(a.getUpvotes() + 1);
                    answerRepository.save(a);
                    awardPoints(a.getAuthorId(), a.getAnswerId(), "UPVOTE", 2);
                }
            });
        }
    }

    @Transactional
    public void markCorrect(UUID answerId) {
        if (answerId != null) {
            answerRepository.findById(answerId).ifPresent(a -> {
                a.setIsCorrect(true);
                answerRepository.save(a);
                awardPoints(a.getAuthorId(), a.getAnswerId(), "CORRECT_ANSWER", 20);
            });
        }
    }

    @Transactional
    public void flag(ForumFlagRequest request) {
         requireActiveActor(request.reporterId());
         ForumFlagEntity flag = new ForumFlagEntity();
         flag.setFlagId(UUID.randomUUID());
         flag.setTargetId(request.targetId());
         flag.setReporterId(request.reporterId());
         flag.setReason(request.reason());
         flag.setCreatedAt(Instant.now());
         flagRepository.save(flag);
    }

    public List<ForumQuestionResponse> getFeed(UUID schoolId, String subject) {
        List<ForumQuestionEntity> questions = (subject != null && !subject.isBlank())
                ? questionRepository.findAllBySchoolIdAndSubjectAndStatusOrderByCreatedAtDesc(schoolId, subject, "APPROVED")
                : questionRepository.findAllBySchoolIdAndStatusOrderByCreatedAtDesc(schoolId, "APPROVED");

        return questions.stream().map(this::toQuestionResponse).collect(Collectors.toList());
    }

    public List<ForumAnswerResponse> getAnswers(UUID questionId) {
        return answerRepository.findAllByQuestionIdAndStatusOrderByUpvotesDesc(questionId, "APPROVED")
                .stream().map(this::toAnswerResponse).collect(Collectors.toList());
    }

    public ForumLeaderboardResponse getLeaderboard(UUID schoolId, String period) {
        Instant since = switch (period.toUpperCase()) {
            case "WEEKLY" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "MONTHLY" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default -> Instant.EPOCH;
        };

        List<Object[]> data = pointLogRepository.findLeaderboard(schoolId, since);
        List<ForumLeaderboardEntry> entries = new ArrayList<>();
        for (Object[] row : data) {
            UUID userId = (UUID) row[0];
            long totalPoints = (long) row[2];
            
            if (userId != null) {
                userRepository.findById(userId).ifPresent(u -> {
                    entries.add(new ForumLeaderboardEntry(userId, u.getFullName(), u.getRoleName(), totalPoints, entries.size() + 1));
                });
            }
            if (entries.size() >= 10) break;
        }

        return new ForumLeaderboardResponse(schoolId, period, entries);
    }

    private void awardPoints(UUID userId, UUID refId, String type, int pts) {
        if (userId != null) {
            userRepository.findById(userId).ifPresent(u -> {
                ForumPointLogEntity log = new ForumPointLogEntity();
                log.setLogId(UUID.randomUUID());
                log.setUserId(userId);
                log.setSchoolId(u.getSchoolId());
                log.setPoints(pts);
                log.setPointType(type);
                log.setReferenceId(refId);
                log.setTimestamp(Instant.now());
                pointLogRepository.save(log);
            });
        }
    }

    private ForumQuestionResponse toQuestionResponse(ForumQuestionEntity e) {
        long answerCount = answerRepository.countByQuestionIdAndStatus(e.getQuestionId(), "APPROVED");
        return new ForumQuestionResponse(
                e.getQuestionId(), e.getSchoolId(), e.getAuthorId(), e.getAuthorName(),
                e.getTitle(), e.getContent(), e.getSubject(), e.getStatus(), e.getUpvotes(),
                (int) answerCount, e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    private ForumAnswerResponse toAnswerResponse(ForumAnswerEntity e) {
        return new ForumAnswerResponse(
                e.getAnswerId(), e.getQuestionId(), e.getAuthorId(), e.getAuthorName(),
                e.getContent(), e.getIsCorrect(), e.getUpvotes(), e.getStatus(), e.getCreatedAt()
        );
    }

    private SchoolUserEntity requireActiveActor(UUID userId) {
        if (userId == null) {
            throw new ForbiddenException("Missing user context.");
        }
        SchoolUserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ForbiddenException("User not found."));
        if (user.getActive() == null || !user.getActive()) {
            throw new ForbiddenException("User is inactive.");
        }
        return user;
    }

    private SchoolUserEntity requireActiveActorInSchool(UUID userId, UUID schoolId) {
        if (schoolId == null) {
            throw new IllegalArgumentException("Missing school context.");
        }
        SchoolUserEntity user = requireActiveActor(userId);
        if (user.getSchoolId() == null || !user.getSchoolId().equals(schoolId)) {
            throw new ForbiddenException("Access denied for the requested school.");
        }
        return user;
    }
}
