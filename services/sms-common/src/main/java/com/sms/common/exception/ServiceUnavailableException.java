package com.sms.common.exception;

/**
 * Thrown when a request cannot be served due to a dependency being unavailable
 * (e.g., entitlement service down).
 */
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message) {
        super(message);
    }

    public ServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}

