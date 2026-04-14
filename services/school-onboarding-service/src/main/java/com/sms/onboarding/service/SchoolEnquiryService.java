package com.sms.onboarding.service;

import com.sms.onboarding.api.SchoolCmsDtos.SchoolEnquiryRequest;
import com.sms.onboarding.api.SchoolCmsDtos.SchoolEnquiryResponse;
import com.sms.onboarding.domain.cms.SchoolEnquiryEntity;
import com.sms.onboarding.repository.cms.SchoolEnquiryRepository;
import com.sms.onboarding.repository.SchoolOnboardingJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class SchoolEnquiryService {

    private final SchoolEnquiryRepository enquiryRepository;
    private final SchoolOnboardingJpaRepository onboardingRepository;

    public SchoolEnquiryService(
            SchoolEnquiryRepository enquiryRepository,
            SchoolOnboardingJpaRepository onboardingRepository) {
        this.enquiryRepository = enquiryRepository;
        this.onboardingRepository = onboardingRepository;
    }

    @Transactional
    public SchoolEnquiryResponse submitEnquiry(String schoolCode, SchoolEnquiryRequest request) {
        var onboarding = onboardingRepository.findBySchoolCodeIgnoreCase(schoolCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found: " + schoolCode));

        UUID tenantId = onboarding.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "School not yet activated.");
        }

        SchoolEnquiryEntity entity = new SchoolEnquiryEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setType(request.type() != null ? request.type().toUpperCase(Locale.ROOT) : "CONTACT");
        entity.setStudentName(request.studentName());
        entity.setParentName(request.parentName());
        entity.setPhone(request.phone());
        entity.setEmail(request.email());
        entity.setClassInterested(request.classInterested());
        entity.setMessage(request.message());
        entity.setSource(request.source() != null ? request.source() : "WEBSITE");
        entity.setStatus("NEW");
        entity.setCreatedAt(Instant.now());

        return mapToResponse(enquiryRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<SchoolEnquiryResponse> getEnquiries(UUID tenantId, String status, String type) {
        List<SchoolEnquiryEntity> results;
        if (status != null && type != null) {
            results = enquiryRepository.findByTenantIdAndStatusAndTypeOrderByCreatedAtDesc(
                    tenantId, status.toUpperCase(Locale.ROOT), type.toUpperCase(Locale.ROOT));
        } else if (status != null) {
            results = enquiryRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(
                    tenantId, status.toUpperCase(Locale.ROOT));
        } else if (type != null) {
            results = enquiryRepository.findByTenantIdAndTypeOrderByCreatedAtDesc(
                    tenantId, type.toUpperCase(Locale.ROOT));
        } else {
            results = enquiryRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
        return results.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void updateStatus(UUID tenantId, UUID enquiryId, String status) {
        SchoolEnquiryEntity entity = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enquiry not found"));

        if (!entity.getTenantId().equals(tenantId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: tenant mismatch");
        }

        String normalized = status.toUpperCase(Locale.ROOT);
        if (!List.of("NEW", "IN_PROGRESS", "RESOLVED", "SPAM").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }

        entity.setStatus(normalized);
        enquiryRepository.save(entity);
    }

    public long countByStatus(UUID tenantId, String status) {
        return enquiryRepository.countByTenantIdAndStatus(tenantId, status.toUpperCase(Locale.ROOT));
    }

    private SchoolEnquiryResponse mapToResponse(SchoolEnquiryEntity e) {
        return new SchoolEnquiryResponse(
                e.getId(), e.getType(), e.getStudentName(), e.getParentName(),
                e.getPhone(), e.getEmail(), e.getClassInterested(),
                e.getMessage(), e.getStatus(), e.getSource(), e.getCreatedAt()
        );
    }
}
