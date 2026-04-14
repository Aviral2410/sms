package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportBoardingLogEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportBoardingLogRepository extends JpaRepository<TransportBoardingLogEntity, UUID> {
    List<TransportBoardingLogEntity> findByTripIdOrderByCreatedAtDesc(UUID tripId);
    List<TransportBoardingLogEntity> findByTripIdAndStudentUserIdOrderByCreatedAtDesc(UUID tripId, UUID studentUserId);
    long countByTripIdAndBoardingState(UUID tripId, String boardingState);
}
