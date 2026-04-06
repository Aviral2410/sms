package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transport_vehicle_position", schema = "schoolops")
public class TransportVehiclePositionEntity {
    @Id
    @Column(name = "position_id", nullable = false, updatable = false)
    private UUID position_id;
    @Column(name = "route_id", nullable = false)
    private UUID routeId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "latitude", nullable = false)
    private BigDecimal latitude;
    @Column(name = "longitude", nullable = false)
    private BigDecimal longitude;
    @Column(name = "speed")
    private BigDecimal speed;
    @Column(name = "heading")
    private BigDecimal heading;
    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    public UUID getPositionId() { return position_id; }
    public void setPositionId(UUID position_id) { this.position_id = position_id; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public BigDecimal getSpeed() { return speed; }
    public void setSpeed(BigDecimal speed) { this.speed = speed; }
    public BigDecimal getHeading() { return heading; }
    public void setHeading(BigDecimal heading) { this.heading = heading; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
