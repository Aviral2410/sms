package com.sms.communication.repository;

import com.sms.communication.domain.MessageEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {
    List<MessageEntity> findBySchoolIdAndThreadIdOrderByCreatedAtAsc(UUID schoolId, UUID threadId);

    long countBySchoolIdAndThreadIdAndCreatedAtAfterAndSenderUserIdNot(
            UUID schoolId,
            UUID threadId,
            Instant createdAtAfter,
            UUID senderUserId
    );

    long countBySchoolIdAndThreadIdAndSenderUserIdNot(UUID schoolId, UUID threadId, UUID senderUserId);
}
