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
@Table(name = "transport_stop", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportStopEntity {
    @Id
    @Column(name = "stop_id", nullable = false, updatable = false)
    private UUID stopId;
    @Column(name = "route_id", nullable = false)
    private UUID routeId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "stop_name", nullable = false)
    private String stopName;
    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;
    @Column(name = "locality_label")
    private String localityLabel;
    @Column(name = "geofence_radius_meters")
    private BigDecimal geofenceRadiusMeters;
    @Column(name = "stop_type")
    private String stopType;
    @Column(name = "stop_status")
    private String stopStatus;
    @Column(name = "latitude")
    private BigDecimal latitude;
    @Column(name = "longitude")
    private BigDecimal longitude;
    @Column(name = "pickup_time")
    private String pickupTime;
    @Column(name = "drop_time")
    private String dropTime;
    @Column(name = "scheduled_pickup_window_start")
    private String scheduledPickupWindowStart;
    @Column(name = "scheduled_pickup_window_end")
    private String scheduledPickupWindowEnd;
    @Column(name = "scheduled_drop_window_start")
    private String scheduledDropWindowStart;
    @Column(name = "scheduled_drop_window_end")
    private String scheduledDropWindowEnd;
    @Column(name = "campus_stop")
    private Boolean campusStop;
    @Column(name = "depot_stop")
    private Boolean depotStop;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;

    public UUID getStopId() { return stopId; }
    public void setStopId(UUID stopId) { this.stopId = stopId; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getStopName() { return stopName; }
    public void setStopName(String stopName) { this.stopName = stopName; }
    public Integer getStopOrder() { return stopOrder; }
    public void setStopOrder(Integer stopOrder) { this.stopOrder = stopOrder; }
    public String getLocalityLabel() { return localityLabel; }
    public void setLocalityLabel(String localityLabel) { this.localityLabel = localityLabel; }
    public BigDecimal getGeofenceRadiusMeters() { return geofenceRadiusMeters; }
    public void setGeofenceRadiusMeters(BigDecimal geofenceRadiusMeters) { this.geofenceRadiusMeters = geofenceRadiusMeters; }
    public String getStopType() { return stopType; }
    public void setStopType(String stopType) { this.stopType = stopType; }
    public String getStopStatus() { return stopStatus; }
    public void setStopStatus(String stopStatus) { this.stopStatus = stopStatus; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public String getPickupTime() { return pickupTime; }
    public void setPickupTime(String pickupTime) { this.pickupTime = pickupTime; }
    public String getDropTime() { return dropTime; }
    public void setDropTime(String dropTime) { this.dropTime = dropTime; }
    public String getScheduledPickupWindowStart() { return scheduledPickupWindowStart; }
    public void setScheduledPickupWindowStart(String scheduledPickupWindowStart) { this.scheduledPickupWindowStart = scheduledPickupWindowStart; }
    public String getScheduledPickupWindowEnd() { return scheduledPickupWindowEnd; }
    public void setScheduledPickupWindowEnd(String scheduledPickupWindowEnd) { this.scheduledPickupWindowEnd = scheduledPickupWindowEnd; }
    public String getScheduledDropWindowStart() { return scheduledDropWindowStart; }
    public void setScheduledDropWindowStart(String scheduledDropWindowStart) { this.scheduledDropWindowStart = scheduledDropWindowStart; }
    public String getScheduledDropWindowEnd() { return scheduledDropWindowEnd; }
    public void setScheduledDropWindowEnd(String scheduledDropWindowEnd) { this.scheduledDropWindowEnd = scheduledDropWindowEnd; }
    public Boolean getCampusStop() { return campusStop; }
    public void setCampusStop(Boolean campusStop) { this.campusStop = campusStop; }
    public Boolean getDepotStop() { return depotStop; }
    public void setDepotStop(Boolean depotStop) { this.depotStop = depotStop; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
