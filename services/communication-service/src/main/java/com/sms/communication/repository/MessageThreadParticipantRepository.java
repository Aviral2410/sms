package com.sms.communication.repository;

import com.sms.communication.domain.MessageThreadParticipantEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageThreadParticipantRepository extends JpaRepository<MessageThreadParticipantEntity, UUID> {
    List<MessageThreadParticipantEntity> findBySchoolIdAndThreadIdOrderByJoinedAtAsc(UUID schoolId, UUID threadId);
    Optional<MessageThreadParticipantEntity> findBySchoolIdAndThreadIdAndUserId(UUID schoolId, UUID threadId, UUID userId);
}

