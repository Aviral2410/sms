package com.sms.onboarding.api;

import com.sms.onboarding.service.OnboardingNotFoundException;
import com.sms.onboarding.service.InvalidOnboardingTransitionException;
import com.sms.onboarding.service.PlatformConfigNotFoundException;
import com.sms.onboarding.service.PublicMediaAssetNotFoundException;
import com.sms.onboarding.service.PublicSchoolProfileNotFoundException;
import com.sms.onboarding.service.SchoolStatusNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    @ExceptionHandler(OnboardingNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleNotFound(OnboardingNotFoundException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problemDetail.setTitle("Onboarding record not found");
        problemDetail.setType(URI.create("https://sms.local/problems/onboarding-not-found"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed");
        problemDetail.setTitle("Invalid onboarding payload");
        problemDetail.setType(URI.create("https://sms.local/problems/validation-error"));
        problemDetail.setProperty("errors", exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList());
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ProblemDetail handleConflict(DataIntegrityViolationException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "A school with the same code already exists."
        );
        problemDetail.setTitle("Duplicate school code");
        problemDetail.setType(URI.create("https://sms.local/problems/duplicate-school-code"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(InvalidOnboardingTransitionException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ProblemDetail handleInvalidTransition(InvalidOnboardingTransitionException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
        problemDetail.setTitle("Invalid onboarding transition");
        problemDetail.setType(URI.create("https://sms.local/problems/invalid-onboarding-transition"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(SchoolStatusNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleStatusNotFound(SchoolStatusNotFoundException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problemDetail.setTitle("School status not found");
        problemDetail.setType(URI.create("https://sms.local/problems/school-status-not-found"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(PlatformConfigNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handlePlatformConfigNotFound(PlatformConfigNotFoundException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problemDetail.setTitle("Platform config not found");
        problemDetail.setType(URI.create("https://sms.local/problems/platform-config-not-found"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(PublicMediaAssetNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handlePublicMediaAssetNotFound(PublicMediaAssetNotFoundException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problemDetail.setTitle("Public media asset not found");
        problemDetail.setType(URI.create("https://sms.local/problems/public-media-asset-not-found"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(PublicSchoolProfileNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handlePublicSchoolProfileNotFound(PublicSchoolProfileNotFoundException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problemDetail.setTitle("Public school profile not found");
        problemDetail.setType(URI.create("https://sms.local/problems/public-school-profile-not-found"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        problemDetail.setTitle("Validation error");
        problemDetail.setType(URI.create("https://sms.local/problems/validation-error"));
        return attachRequestId(problemDetail, request);
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ProblemDetail handleIllegalState(IllegalStateException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
        problemDetail.setTitle("Service unavailable");
        problemDetail.setType(URI.create("https://sms.local/problems/service-unavailable"));
        return attachRequestId(problemDetail, request);
    }

    private ProblemDetail attachRequestId(ProblemDetail problemDetail, HttpServletRequest request) {
        String requestId = request == null ? null : request.getHeader(REQUEST_ID_HEADER);
        if (requestId != null && !requestId.isBlank()) {
            problemDetail.setProperty("requestId", requestId);
        }
        return problemDetail;
    }
}
