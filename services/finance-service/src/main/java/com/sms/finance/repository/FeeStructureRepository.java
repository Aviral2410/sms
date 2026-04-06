package com.sms.finance.repository;

import com.sms.finance.domain.FeeStructureEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FeeStructureRepository extends JpaRepository<FeeStructureEntity, UUID> {
}
