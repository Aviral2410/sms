package com.sms.onboarding.api;

import com.sms.onboarding.service.OnboardingNotFoundException;
import com.sms.onboarding.service.InvalidOnboardingTransitionException;
import com.sms.onboarding.service.SchoolStatusNotFoundException;
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

    @ExceptionHandler(OnboardingNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleNotFound(OnboardingNotFoundException exception) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problemDetail.setTitle("Onboarding record not found");
        problemDetail.setType(URI.create("https://sms.local/problems/onboarding-not-found"));
        return problemDetail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleValidation(MethodArgumentNotValidException exception) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed");
        problemDetail.setTitle("Invalid onboarding payload");
        problemDetail.setType(URI.create("https://sms.local/problems/validation-error"));
        problemDetail.setProperty("errors", exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList());
        return problemDetail;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ProblemDetail handleConflict(DataIntegrityViolationException exception) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "A school with the same code already exists."
        );
        problemDetail.setTitle("Duplicate school code");
        problemDetail.setType(URI.create("https://sms.local/problems/duplicate-school-code"));
        return problemDetail;
    }

    @ExceptionHandler(InvalidOnboardingTransitionException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ProblemDetail handleInvalidTransition(InvalidOnboardingTransitionException exception) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
        problemDetail.setTitle("Invalid onboarding transition");
        problemDetail.setType(URI.create("https://sms.local/problems/invalid-onboarding-transition"));
        return problemDetail;
    }

    @ExceptionHandler(SchoolStatusNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ProblemDetail handleStatusNotFound(SchoolStatusNotFoundException exception) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
        problemDetail.setTitle("School status not found");
        problemDetail.setType(URI.create("https://sms.local/problems/school-status-not-found"));
        return problemDetail;
    }
}
