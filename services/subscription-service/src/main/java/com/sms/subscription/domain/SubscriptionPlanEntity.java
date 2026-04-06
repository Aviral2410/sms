package com.sms.subscription.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlanEntity {
    @Id
    private UUID planId;

    @Column(nullable = false, unique = true)
    private String planName; // BASIC, PROFESSIONAL, ENTERPRISE

    @Column(nullable = false)
    private String planCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal monthlyPrice;

    @Column(nullable = false)
    private int maxStudents;

    @Column(name = "max_parents_per_student", nullable = false)
    private int maxParentsPerStudent;

    @Column(nullable = false)
    private String features; // JSON or Comma separated list for simple MVP

    private Instant createdAt;

    public UUID getPlanId() { return planId; }
    public void setPlanId(UUID planId) { this.planId = planId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(BigDecimal monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public int getMaxStudents() { return maxStudents; }
    public void setMaxStudents(int maxStudents) { this.maxStudents = maxStudents; }

    public int getMaxParentsPerStudent() { return maxParentsPerStudent; }
    public void setMaxParentsPerStudent(int maxParentsPerStudent) { this.maxParentsPerStudent = maxParentsPerStudent; }

    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
