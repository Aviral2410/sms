package com.sms.finance.security;

import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
public class HibernateFilterAspect {

    @Autowired
    private EntityManager entityManager;

    @Before("execution(* com.sms.finance.repository..*(..))")
    public void enableTenantFilter() {
        String schoolId = SchoolContext.getCurrentSchoolId();
        if (schoolId != null && !schoolId.isBlank()) {
            try {
                UUID schoolUuid = UUID.fromString(schoolId.trim());
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter("schoolFilter").setParameter("schoolId", schoolUuid);
            } catch (IllegalArgumentException ignored) {
            }
        }
    }
}
