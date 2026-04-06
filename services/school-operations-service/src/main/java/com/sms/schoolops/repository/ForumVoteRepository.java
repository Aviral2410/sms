package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ForumVoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ForumVoteRepository extends JpaRepository<ForumVoteEntity, UUID> {
    Optional<ForumVoteEntity> findByTargetIdAndVoterId(UUID targetId, UUID voterId);
}
