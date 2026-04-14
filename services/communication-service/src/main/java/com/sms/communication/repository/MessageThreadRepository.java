package com.sms.communication.repository;

import com.sms.communication.domain.MessageThreadEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageThreadRepository extends JpaRepository<MessageThreadEntity, UUID> {
    Optional<MessageThreadEntity> findBySchoolIdAndThreadId(UUID schoolId, UUID threadId);

    @Query("""
            select t from MessageThreadEntity t
            join MessageThreadParticipantEntity p on p.threadId = t.threadId
            where t.schoolId = :schoolId and p.userId = :userId
            order by t.updatedAt desc
            """)
    List<MessageThreadEntity> findThreadsForUser(UUID schoolId, UUID userId);
}

