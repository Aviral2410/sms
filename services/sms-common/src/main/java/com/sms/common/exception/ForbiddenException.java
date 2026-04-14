package com.sms.common.exception;

/**
 * Thrown when an authenticated caller is not allowed to perform an action
 * (e.g., missing plan feature or insufficient role).
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}

