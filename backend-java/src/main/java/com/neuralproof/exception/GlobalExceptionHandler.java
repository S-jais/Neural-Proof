package com.neuralproof.exception;

import com.neuralproof.dto.ErrorResponse;
import com.neuralproof.security.CorrelationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private String getCorrelationId() {
        String cid = MDC.get(CorrelationFilter.MDC_KEY);
        return cid != null ? cid : "unknown";
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<String> details = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            details.add(error.getField() + ": " + error.getDefaultMessage());
        }

        ErrorResponse err = new ErrorResponse(
                "VALIDATION_ERROR",
                "Input validation failed",
                getCorrelationId(),
                details
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        String code = ex.getStatusCode().equals(HttpStatus.NOT_FOUND) ? "NOT_FOUND" :
                      ex.getStatusCode().equals(HttpStatus.CONFLICT) ? "CONFLICTING_STATE" :
                      ex.getStatusCode().equals(HttpStatus.TOO_MANY_REQUESTS) ? "RATE_LIMITED" : "API_ERROR";

        ErrorResponse err = new ErrorResponse(
                code,
                ex.getReason() != null ? ex.getReason() : ex.getMessage(),
                getCorrelationId()
        );
        return ResponseEntity.status(ex.getStatusCode()).body(err);
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        ErrorResponse err = new ErrorResponse(
                "NOT_FOUND",
                ex.getMessage(),
                getCorrelationId()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(org.springframework.web.HttpMediaTypeNotSupportedException ex) {
        ErrorResponse err = new ErrorResponse(
                "UNSUPPORTED_MEDIA_TYPE",
                "Content-Type must be application/json",
                getCorrelationId()
        );
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(err);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorResponse err = new ErrorResponse(
                "VALIDATION_ERROR",
                ex.getMessage(),
                getCorrelationId()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception [cid={}]: {}", getCorrelationId(), ex.getMessage(), ex);
        ErrorResponse err = new ErrorResponse(
                "INTERNAL_ERROR",
                "An unexpected server error occurred. Please try again.",
                getCorrelationId()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
    }
}
