package com.sms.onboarding.repository;

import com.sms.onboarding.domain.RequiredDocumentTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequiredDocumentTemplateJpaRepository extends JpaRepository<RequiredDocumentTemplateEntity, Long> {

    List<RequiredDocumentTemplateEntity> findByActiveTrueOrderByDisplayOrderAsc();
}
