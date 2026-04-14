package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_gps_ping", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportGpsPingEntity {
    @Id
    @Column(name = "ping_id", nullable = false, updatable = false)
    private UUID pingId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "trip_id")
    private UUID tripId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "route_id")
    private UUID routeId;

    @Column(name = "latitude", nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false)
    private BigDecimal longitude;

    @Column(name = "speed")
    private BigDecimal speed;

    @Column(name = "heading")
    private BigDecimal heading;

    @Column(name = "accuracy_meters")
    private BigDecimal accuracyMeters;

    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    public UUID getPingId() { return pingId; }
    public void setPingId(UUID pingId) { this.pingId = pingId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getTripId() { return tripId; }
    public void setTripId(UUID tripId) { this.tripId = tripId; }
    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public BigDecimal getSpeed() { return speed; }
    public void setSpeed(BigDecimal speed) { this.speed = speed; }
    public BigDecimal getHeading() { return heading; }
    public void setHeading(BigDecimal heading) { this.heading = heading; }
    public BigDecimal getAccuracyMeters() { return accuracyMeters; }
    public void setAccuracyMeters(BigDecimal accuracyMeters) { this.accuracyMeters = accuracyMeters; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
