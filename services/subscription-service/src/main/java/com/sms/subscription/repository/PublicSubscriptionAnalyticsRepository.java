package com.sms.subscription.repository;

import com.sms.subscription.api.SubscriptionDtos.PublicAttachedSchool;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PublicSubscriptionAnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public PublicSubscriptionAnalyticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long countConnectedSchools() {
        Long value = jdbcTemplate.queryForObject("""
                SELECT COUNT(DISTINCT school_code)
                FROM onboarding.school_onboarding
                WHERE school_code IS NOT NULL
                  AND status IN ('APPROVED', 'UNDER_REVIEW', 'SUBMITTED')
                """, Long.class);
        return value == null ? 0L : value;
    }

    public long countTotalUsers() {
        Long value = jdbcTemplate.queryForObject("""
                SELECT
                    COALESCE((SELECT COUNT(*) FROM identity.tenant_user_account WHERE active = TRUE), 0)
                  + COALESCE((SELECT COUNT(*) FROM identity.school_account WHERE active = TRUE), 0)
                  + COALESCE((SELECT COUNT(*) FROM identity.admin_account WHERE active = TRUE), 0)
                """, Long.class);
        return value == null ? 0L : value;
    }

    public List<String> findAttachedSchoolNames(int limit) {
        return jdbcTemplate.query("""
                SELECT school_name
                FROM onboarding.school_onboarding
                WHERE school_name IS NOT NULL
                  AND status IN ('APPROVED', 'UNDER_REVIEW', 'SUBMITTED')
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getString("school_name"),
                limit
        );
    }

    public List<PublicAttachedSchool> findAttachedSchools(int limit) {
        return jdbcTemplate.query("""
                SELECT school_name, school_code, logo_url
                FROM onboarding.school_onboarding
                WHERE school_name IS NOT NULL
                  AND status IN ('APPROVED', 'UNDER_REVIEW', 'SUBMITTED')
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new PublicAttachedSchool(
                        rs.getString("school_name"),
                        rs.getString("school_code"),
                        rs.getString("logo_url")
                ),
                limit
        );
    }
}
