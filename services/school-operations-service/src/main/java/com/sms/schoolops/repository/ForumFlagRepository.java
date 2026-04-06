package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ForumFlagEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ForumFlagRepository extends JpaRepository<ForumFlagEntity, UUID> {
}
