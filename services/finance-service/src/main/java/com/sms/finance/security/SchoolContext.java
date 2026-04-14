package com.sms.finance.security;

public class SchoolContext {
    private static final ThreadLocal<String> CURRENT_SCHOOL = new ThreadLocal<>();

    public static String getCurrentSchoolId() {
        return CURRENT_SCHOOL.get();
    }

    public static void setCurrentSchoolId(String schoolId) {
        CURRENT_SCHOOL.set(schoolId);
    }

    public static void clear() {
        CURRENT_SCHOOL.remove();
    }
}

