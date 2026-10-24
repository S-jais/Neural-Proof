package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verification_events", indexes = {
    @Index(name = "idx_events_run_created", columnList = "run_id, created_at")
})
public class VerificationEvent {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private VerificationRun run;

    @Column(name = "claim_id")
    private UUID claimId;

    @Column(nullable = false, length = 32)
    private String stage;

    @Column(nullable = false, length = 16)
    private String level;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String detailsJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public VerificationEvent() {}

    public VerificationEvent(VerificationRun run, UUID claimId, String stage, String level, String message, String detailsJson) {
        this.run = run;
        this.claimId = claimId;
        this.stage = stage;
        this.level = level;
        this.message = message;
        this.detailsJson = detailsJson;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public VerificationRun getRun() { return run; }
    public void setRun(VerificationRun run) { this.run = run; }

    public UUID getClaimId() { return claimId; }
    public void setClaimId(UUID claimId) { this.claimId = claimId; }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getDetailsJson() { return detailsJson; }
    public void setDetailsJson(String detailsJson) { this.detailsJson = detailsJson; }

    public Instant getCreatedAt() { return createdAt; }
}
