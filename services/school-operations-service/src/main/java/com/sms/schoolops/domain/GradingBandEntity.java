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
@Table(name = "grading_band", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class GradingBandEntity {

    @Id
    @Column(name = "band_id", nullable = false, updatable = false)
    private UUID bandId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "scheme_id", nullable = false)
    private UUID schemeId;

    @Column(name = "grade", nullable = false)
    private String grade;

    @Column(name = "min_percentage", nullable = false)
    private BigDecimal minPercentage;

    @Column(name = "max_percentage", nullable = false)
    private BigDecimal maxPercentage;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getBandId() {
        return bandId;
    }

    public void setBandId(UUID bandId) {
        this.bandId = bandId;
    }

    public UUID getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(UUID schoolId) {
        this.schoolId = schoolId;
    }

    public UUID getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(UUID schemeId) {
        this.schemeId = schemeId;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public BigDecimal getMinPercentage() {
        return minPercentage;
    }

    public void setMinPercentage(BigDecimal minPercentage) {
        this.minPercentage = minPercentage;
    }

    public BigDecimal getMaxPercentage() {
        return maxPercentage;
    }

    public void setMaxPercentage(BigDecimal maxPercentage) {
        this.maxPercentage = maxPercentage;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

