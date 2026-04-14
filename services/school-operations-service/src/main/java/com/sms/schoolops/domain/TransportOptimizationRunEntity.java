package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_optimization_run", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportOptimizationRunEntity {
    @Id
    @Column(name = "optimization_run_id", nullable = false, updatable = false)
    private UUID optimizationRunId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "shift_type")
    private String shiftType;

    @Column(name = "service_date")
    private LocalDate serviceDate;

    @Column(name = "input_snapshot_json")
    private String inputSnapshotJson;

    @Column(name = "cluster_snapshot_json")
    private String clusterSnapshotJson;

    @Column(name = "proposal_snapshot_json")
    private String proposalSnapshotJson;

    @Column(name = "before_vehicle_count")
    private Integer beforeVehicleCount;

    @Column(name = "after_vehicle_count")
    private Integer afterVehicleCount;

    @Column(name = "distance_saved_km")
    private BigDecimal distanceSavedKm;

    @Column(name = "time_saved_minutes")
    private Integer timeSavedMinutes;

    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;

    @Column(name = "explanation")
    private String explanation;

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getOptimizationRunId() { return optimizationRunId; }
    public void setOptimizationRunId(UUID optimizationRunId) { this.optimizationRunId = optimizationRunId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getRequestedBy() { return requestedBy; }
    public void setRequestedBy(UUID requestedBy) { this.requestedBy = requestedBy; }
    public String getRequestedByName() { return requestedByName; }
    public void setRequestedByName(String requestedByName) { this.requestedByName = requestedByName; }
    public String getShiftType() { return shiftType; }
    public void setShiftType(String shiftType) { this.shiftType = shiftType; }
    public LocalDate getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDate serviceDate) { this.serviceDate = serviceDate; }
    public String getInputSnapshotJson() { return inputSnapshotJson; }
    public void setInputSnapshotJson(String inputSnapshotJson) { this.inputSnapshotJson = inputSnapshotJson; }
    public String getClusterSnapshotJson() { return clusterSnapshotJson; }
    public void setClusterSnapshotJson(String clusterSnapshotJson) { this.clusterSnapshotJson = clusterSnapshotJson; }
    public String getProposalSnapshotJson() { return proposalSnapshotJson; }
    public void setProposalSnapshotJson(String proposalSnapshotJson) { this.proposalSnapshotJson = proposalSnapshotJson; }
    public Integer getBeforeVehicleCount() { return beforeVehicleCount; }
    public void setBeforeVehicleCount(Integer beforeVehicleCount) { this.beforeVehicleCount = beforeVehicleCount; }
    public Integer getAfterVehicleCount() { return afterVehicleCount; }
    public void setAfterVehicleCount(Integer afterVehicleCount) { this.afterVehicleCount = afterVehicleCount; }
    public BigDecimal getDistanceSavedKm() { return distanceSavedKm; }
    public void setDistanceSavedKm(BigDecimal distanceSavedKm) { this.distanceSavedKm = distanceSavedKm; }
    public Integer getTimeSavedMinutes() { return timeSavedMinutes; }
    public void setTimeSavedMinutes(Integer timeSavedMinutes) { this.timeSavedMinutes = timeSavedMinutes; }
    public BigDecimal getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(BigDecimal confidenceScore) { this.confidenceScore = confidenceScore; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
