package com.sms.schoolops.security;

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

    @Before("execution(* com.sms.schoolops.repository..*(..))")
    public void enableSchoolFilter() {
        String schoolId = SchoolContext.getCurrentSchoolId();
        if (schoolId != null && !schoolId.isBlank()) {
            try {
                UUID schoolUuid = UUID.fromString(schoolId.trim());
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter("schoolFilter").setParameter("schoolId", schoolUuid);
            } catch (IllegalArgumentException ignored) {
                // Ignore invalid header values; requests will behave as unscoped reads/writes (same as before)
                // but gateway should be injecting valid UUIDs.
            }
        }
    }
}
