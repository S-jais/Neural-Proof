package com.neuralproof.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ErrorResponse {

    private String code;
    private String message;
    private String correlationId;
    private List<String> details = new ArrayList<>();
    private Instant timestamp = Instant.now();

    public ErrorResponse() {}

    public ErrorResponse(String code, String message, String correlationId) {
        this.code = code;
        this.message = message;
        this.correlationId = correlationId;
        this.details = new ArrayList<>();
        this.timestamp = Instant.now();
    }

    public ErrorResponse(String code, String message, String correlationId, List<String> details) {
        this.code = code;
        this.message = message;
        this.correlationId = correlationId;
        this.details = details != null ? details : new ArrayList<>();
        this.timestamp = Instant.now();
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public List<String> getDetails() { return details; }
    public void setDetails(List<String> details) { this.details = details; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
