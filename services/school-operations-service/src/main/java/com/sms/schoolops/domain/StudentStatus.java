package com.sms.schoolops.domain;

public enum StudentStatus {
    LEAD,        // Initial interest
    APPLICATION, // Applied for admission
    ADMITTED,    // Admission confirmed
    ACTIVE,      // Currently enrolled and attending
    INACTIVE,    // Withdrawn or suspended
    ALUMNI       // Graduated
}
