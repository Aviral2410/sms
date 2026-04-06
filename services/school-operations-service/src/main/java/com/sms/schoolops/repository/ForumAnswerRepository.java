package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ForumAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForumAnswerRepository extends JpaRepository<ForumAnswerEntity, UUID> {
    List<ForumAnswerEntity> findAllByQuestionIdAndStatusOrderByUpvotesDesc(UUID questionId, String status);
    List<ForumAnswerEntity> findAllByQuestionIdAndStatusOrderByCreatedAtAsc(UUID questionId, String status);
    long countByQuestionIdAndStatus(UUID questionId, String status);
}
