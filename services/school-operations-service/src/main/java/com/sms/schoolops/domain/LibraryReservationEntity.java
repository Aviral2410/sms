package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "library_reservation", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class LibraryReservationEntity {
    @Id
    @Column(name = "reservation_id", nullable = false, updatable = false)
    private UUID reservationId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "resource_id", nullable = false)
    private UUID resourceId;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "reserved_at", nullable = false)
    private Instant reservedAt;
    @Column(name = "valid_until")
    private Instant validUntil;

    public UUID getReservationId() { return reservationId; }
    public void setReservationId(UUID reservationId) { this.reservationId = reservationId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getResourceId() { return resourceId; }
    public void setResourceId(UUID resourceId) { this.resourceId = resourceId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getReservedAt() { return reservedAt; }
    public void setReservedAt(Instant reservedAt) { this.reservedAt = reservedAt; }
    public Instant getValidUntil() { return validUntil; }
    public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }
}
