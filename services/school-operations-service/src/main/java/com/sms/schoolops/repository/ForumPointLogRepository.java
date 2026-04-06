package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ForumPointLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ForumPointLogRepository extends JpaRepository<ForumPointLogEntity, UUID> {
    
    @Query("SELECT f.userId, f.schoolId, SUM(f.points) as totalPoints FROM ForumPointLogEntity f " +
           "WHERE f.schoolId = :schoolId AND f.timestamp >= :since " +
           "GROUP BY f.userId, f.schoolId ORDER BY totalPoints DESC")
    List<Object[]> findLeaderboard(UUID schoolId, Instant since);
}
