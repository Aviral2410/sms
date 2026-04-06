package com.sms.finance.repository;

import com.sms.finance.domain.PaymentRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecordEntity, UUID> {
    List<PaymentRecordEntity> findByStudentUserId(UUID studentUserId);
}
