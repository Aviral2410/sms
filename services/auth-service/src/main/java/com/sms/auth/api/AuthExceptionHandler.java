package com.sms.auth.api;

import com.sms.auth.service.InvalidAdminCredentialsException;
import com.sms.auth.service.InvalidActivationCodeException;
import com.sms.auth.service.ActivationDetailsNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
public class AuthExceptionHandler {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    @ExceptionHandler(InvalidAdminCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ProblemDetail handleInvalidCredentials(InvalidAdminCredentialsException exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, exception.getMessage());
        detail.setTitle("Invalid credentials");
        detail.setType(URI.create("https://sms.local/problems/invalid-admin-credentials"));
        return attachRequestId(detail, request);
    }

    @ExceptionHandler(InvalidActivationCodeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleInvalidActivationCode(InvalidActivationCodeException exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        detail.setTitle("Invalid activation code");
        detail.setType(URI.create("https://sms.local/problems/invalid-activation-code"));
        return attachRequestId(detail, request);
    }

    @ExceptionHandler(ActivationDetailsNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleActivationDetailsNotFound(ActivationDetailsNotFoundException exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        detail.setTitle("Activation details not found");
        detail.setType(URI.create("https://sms.local/problems/activation-details-not-found"));
        return attachRequestId(detail, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException exception, HttpServletRequest request) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        detail.setTitle("Validation error");
        detail.setType(URI.create("https://sms.local/problems/validation-error"));
        return attachRequestId(detail, request);
    }

    private ProblemDetail attachRequestId(ProblemDetail detail, HttpServletRequest request) {
        String requestId = request == null ? null : request.getHeader(REQUEST_ID_HEADER);
        if (requestId != null && !requestId.isBlank()) {
            detail.setProperty("requestId", requestId);
        }
        return detail;
    }
}
