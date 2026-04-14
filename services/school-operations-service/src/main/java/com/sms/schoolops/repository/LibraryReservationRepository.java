package com.sms.schoolops.repository;

import com.sms.schoolops.domain.LibraryReservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LibraryReservationRepository extends JpaRepository<LibraryReservationEntity, UUID> {
    List<LibraryReservationEntity> findBySchoolIdAndUserIdOrderByReservedAtDesc(UUID schoolId, UUID userId);
    int countBySchoolIdAndUserIdAndStatus(UUID schoolId, UUID userId, String status);
}
