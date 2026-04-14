package com.sms.onboarding.domain.cms;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "school_enquiry", schema = "onboarding")
@Getter
@Setter
public class SchoolEnquiryEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "type", nullable = false)
    private String type; // CONTACT, ADMISSION

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "parent_name")
    private String parentName;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "class_interested")
    private String classInterested;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "status")
    private String status = "NEW"; // NEW, IN_PROGRESS, RESOLVED, SPAM

    @Column(name = "source")
    private String source;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
