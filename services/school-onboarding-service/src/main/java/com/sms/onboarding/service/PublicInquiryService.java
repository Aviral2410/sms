package com.sms.onboarding.service;

import com.sms.onboarding.api.PublicInquiryDtos.PublicInquiryRequest;
import com.sms.onboarding.api.PublicInquiryDtos.PublicInquiryResponse;
import com.sms.onboarding.api.PublicInquiryDtos.PlatformPublicInquiryResponse;
import com.sms.onboarding.api.PublicInquiryDtos.UpdatePublicInquiryStatusRequest;
import com.sms.onboarding.domain.PublicInquiryEntity;
import com.sms.onboarding.event.MqttEventPublisher;
import com.sms.onboarding.repository.PublicInquiryRepository;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicInquiryService {

    private final PublicInquiryRepository repository;
    private final MqttEventPublisher mqttEventPublisher;

    public PublicInquiryService(PublicInquiryRepository repository, MqttEventPublisher mqttEventPublisher) {
        this.repository = repository;
        this.mqttEventPublisher = mqttEventPublisher;
    }

    @Transactional
    public PublicInquiryResponse submitContactRequest(PublicInquiryRequest request) {
        return saveInquiry("CONTACT", request);
    }

    @Transactional
    public PublicInquiryResponse submitSupportRequest(PublicInquiryRequest request) {
        return saveInquiry("SUPPORT", request);
    }

    @Transactional(readOnly = true)
    public List<PlatformPublicInquiryResponse> listAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toPlatformResponse)
                .toList();
    }

    @Transactional
    public PlatformPublicInquiryResponse updateStatus(UUID inquiryId, UpdatePublicInquiryStatusRequest request) {
        PublicInquiryEntity entity = repository.findById(inquiryId)
                .orElseThrow(() -> new IllegalArgumentException("Public inquiry not found."));
        entity.setStatus(request.status().trim().toUpperCase(Locale.ROOT));
        PublicInquiryEntity saved = repository.save(entity);
        PlatformPublicInquiryResponse response = toPlatformResponse(saved);
        mqttEventPublisher.publish("platform/public-inquiries/status", response);
        return response;
    }

    private PublicInquiryResponse saveInquiry(String inquiryType, PublicInquiryRequest request) {
        PublicInquiryEntity entity = new PublicInquiryEntity();
        entity.setInquiryId(UUID.randomUUID());
        entity.setInquiryType(inquiryType.toUpperCase(Locale.ROOT));
        entity.setStatus("OPEN");
        entity.setFullName(request.fullName());
        entity.setEmail(request.email());
        entity.setOrganization(request.organization());
        entity.setSchoolName(request.schoolName());
        entity.setPhone(request.phone());
        entity.setSubject(request.subject());
        entity.setMessage(request.message());

        PublicInquiryEntity saved = repository.save(entity);
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("inquiryId", saved.getInquiryId());
        event.put("inquiryType", saved.getInquiryType());
        event.put("status", saved.getStatus());
        event.put("subject", saved.getSubject());
        event.put("fullName", saved.getFullName());
        event.put("schoolName", saved.getSchoolName());
        event.put("createdAt", saved.getCreatedAt());
        mqttEventPublisher.publish("platform/public-inquiries/created", event);
        return new PublicInquiryResponse(saved.getInquiryId(), saved.getInquiryType(), saved.getStatus(), saved.getCreatedAt());
    }

    private PlatformPublicInquiryResponse toPlatformResponse(PublicInquiryEntity entity) {
        return new PlatformPublicInquiryResponse(
                entity.getInquiryId(),
                entity.getInquiryType(),
                entity.getStatus(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getOrganization(),
                entity.getSchoolName(),
                entity.getPhone(),
                entity.getSubject(),
                entity.getMessage(),
                entity.getCreatedAt()
        );
    }
}
