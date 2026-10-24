package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "retrieval_operations")
public class RetrievalOperation {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private VerificationRun run;

    @Column(name = "claim_id")
    private UUID claimId;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(nullable = false, length = 32)
    private String operation;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "retry_count")
    private int retryCount = 0;

    @Column(name = "duration_ms")
    private Double durationMs = 0.0;

    @Column(name = "result_count")
    private int resultCount = 0;

    @Column(name = "cache_hit")
    private boolean cacheHit = false;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public RetrievalOperation() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public VerificationRun getRun() { return run; }
    public void setRun(VerificationRun run) { this.run = run; }

    public UUID getClaimId() { return claimId; }
    public void setClaimId(UUID claimId) { this.claimId = claimId; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getHttpStatus() { return httpStatus; }
    public void setHttpStatus(Integer httpStatus) { this.httpStatus = httpStatus; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    public Double getDurationMs() { return durationMs; }
    public void setDurationMs(Double durationMs) { this.durationMs = durationMs; }

    public int getResultCount() { return resultCount; }
    public void setResultCount(int resultCount) { this.resultCount = resultCount; }

    public boolean isCacheHit() { return cacheHit; }
    public void setCacheHit(boolean cacheHit) { this.cacheHit = cacheHit; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public Instant getCreatedAt() { return createdAt; }
}
