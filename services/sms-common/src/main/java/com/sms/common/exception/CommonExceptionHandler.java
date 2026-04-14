package com.sms.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class CommonExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(CommonExceptionHandler.class);

    @ExceptionHandler(ForbiddenException.class)
    public ProblemDetail handleForbidden(ForbiddenException exception, HttpServletRequest request) {
        logger.warn("Forbidden: {}", exception.getMessage());
        return problem(HttpStatus.FORBIDDEN, "Forbidden", exception.getMessage(), "forbidden", request, null);
    }

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException exception, HttpServletRequest request) {
        logger.warn("Not Found: {}", exception.getMessage());
        return problem(HttpStatus.NOT_FOUND, "Not Found", exception.getMessage(), "not-found", request, null);
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ProblemDetail handleServiceUnavailable(ServiceUnavailableException exception, HttpServletRequest request) {
        logger.error("Service Unavailable: {}", exception.getMessage(), exception);
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "Service Unavailable", exception.getMessage(), "service-unavailable", request, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException exception, HttpServletRequest request) {
        logger.warn("Bad Request: {}", exception.getMessage());
        return problem(HttpStatus.BAD_REQUEST, "Bad Request", exception.getMessage(), "bad-request", request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        logger.warn("Validation failed: {}", exception.getMessage());
        Map<String, Object> props = Map.of(
                "fieldErrors",
                exception.getBindingResult().getFieldErrors().stream()
                        .map(err -> Map.of(
                                "field", err.getField(),
                                "message", err.getDefaultMessage() == null ? "Invalid value" : err.getDefaultMessage()
                        ))
                        .toList()
        );
        return problem(HttpStatus.BAD_REQUEST, "Validation Error", "Invalid request body.", "validation-error", request, props);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException exception, HttpServletRequest request) {
        String name = exception.getName() == null ? "parameter" : exception.getName();
        logger.warn("Type mismatch: {}", name);
        return problem(HttpStatus.BAD_REQUEST, "Bad Request", "Invalid parameter: " + name, "bad-request", request, null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleNotReadable(HttpMessageNotReadableException exception, HttpServletRequest request) {
        logger.warn("Unreadable request body: {}", exception.getMessage());
        return problem(HttpStatus.BAD_REQUEST, "Bad Request", "Invalid request body.", "bad-request", request, null);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ProblemDetail handleMissingHeader(MissingRequestHeaderException exception, HttpServletRequest request) {
        logger.warn("Missing header: {}", exception.getHeaderName());
        return problem(HttpStatus.BAD_REQUEST, "Bad Request", "Missing required header: " + exception.getHeaderName(), "bad-request", request, null);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException exception, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
        HttpStatus resolved = status == null ? HttpStatus.INTERNAL_SERVER_ERROR : status;
        String message = exception.getReason() != null ? exception.getReason() : exception.getMessage();

        if (resolved.is4xxClientError()) {
            logger.warn("HTTP {}: {}", resolved.value(), message);
        } else {
            logger.error("HTTP {}: {}", resolved.value(), message, exception);
        }
        return problem(resolved, resolved.getReasonPhrase(), message, "http-error", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleException(Exception exception, HttpServletRequest request) {
        logger.error("Unhandled error: {}", exception.getMessage(), exception);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Unexpected error.", "internal-server-error", request, null);
    }

    private ProblemDetail problem(
            HttpStatus status,
            String title,
            String detail,
            String typeSuffix,
            HttpServletRequest request,
            Map<String, Object> props
    ) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        pd.setType(URI.create("https://sms.local/problems/" + typeSuffix));

        String requestId = request == null ? null : request.getHeader(RequestIdFilter.HEADER);
        if (requestId != null && !requestId.isBlank()) {
            pd.setInstance(URI.create("urn:request:" + requestId));
            pd.setProperty("requestId", requestId);
        }

        if (props != null) {
            props.forEach(pd::setProperty);
        }
        return pd;
    }
}
