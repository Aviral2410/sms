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
@Table(name = "school_academic_content", schema = "onboarding")
@Getter
@Setter
public class SchoolAcademicContentEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "curriculum", columnDefinition = "TEXT")
    private String curriculum;

    @Column(name = "co_curricular", columnDefinition = "TEXT")
    private String coCurricular;

    @Column(name = "scholarship_info", columnDefinition = "TEXT")
    private String scholarshipInfo;

    @Column(name = "result_highlights", columnDefinition = "TEXT")
    private String resultHighlights;

    @Column(name = "notices", columnDefinition = "TEXT")
    private String notices;

    @Column(name = "calendar_data", columnDefinition = "TEXT")
    private String calendarData;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();
}
