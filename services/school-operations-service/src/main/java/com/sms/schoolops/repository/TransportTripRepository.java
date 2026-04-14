package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportTripEntity;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportTripRepository extends JpaRepository<TransportTripEntity, UUID> {
    List<TransportTripEntity> findBySchoolIdAndServiceDateOrderByUpdatedAtDesc(UUID schoolId, LocalDate serviceDate);
    Optional<TransportTripEntity> findByRouteAssignmentId(UUID routeAssignmentId);
    List<TransportTripEntity> findBySchoolIdAndDriverUserIdAndServiceDateAndTripStateIn(UUID schoolId, UUID driverUserId, LocalDate serviceDate, Collection<String> tripStates);
    List<TransportTripEntity> findBySchoolIdAndConductorUserIdAndServiceDateAndTripStateIn(UUID schoolId, UUID conductorUserId, LocalDate serviceDate, Collection<String> tripStates);
    List<TransportTripEntity> findBySchoolIdAndTripStateInOrderByUpdatedAtDesc(UUID schoolId, Collection<String> tripStates);
}
