package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ForumQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForumQuestionRepository extends JpaRepository<ForumQuestionEntity, UUID> {
    List<ForumQuestionEntity> findAllBySchoolIdAndStatusOrderByCreatedAtDesc(UUID schoolId, String status);
    List<ForumQuestionEntity> findAllBySchoolIdAndSubjectAndStatusOrderByCreatedAtDesc(UUID schoolId, String subject, String status);
}
