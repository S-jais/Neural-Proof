package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "verification_runs", indexes = {
    @Index(name = "idx_runs_session_created", columnList = "owner_session_id, created_at DESC"),
    @Index(name = "idx_runs_input_hash", columnList = "input_hash")
})
public class VerificationRun {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @Column(name = "owner_session_id", nullable = false)
    private String ownerSessionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "input_type", nullable = false, length = 32)
    private InputType inputType;

    @Column(name = "original_input", nullable = false, columnDefinition = "TEXT")
    private String originalInput;

    @Column(name = "context_text", columnDefinition = "TEXT")
    private String contextText;

    @Column(name = "generated_answer", columnDefinition = "TEXT")
    private String generatedAnswer;

    @Column(name = "generation_model", length = 100)
    private String generationModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 16)
    private RunMode mode = RunMode.LIVE;

    @Column(name = "review_before_verify", nullable = false)
    private boolean reviewBeforeVerify = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private RunStatus status = RunStatus.QUEUED;

    @Column(name = "current_stage", length = 32)
    private String currentStage;

    @Column(name = "overall_summary", columnDefinition = "TEXT")
    private String overallSummary;

    @Column(name = "summary_method", length = 32)
    private String summaryMethod;

    @Column(name = "warnings", columnDefinition = "TEXT")
    private String warningsJson;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "limits_snapshot", columnDefinition = "TEXT")
    private String limitsSnapshotJson;

    @Column(name = "input_hash", length = 64)
    private String inputHash;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Claim> claims = new ArrayList<>();

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<EvidenceSource> sources = new ArrayList<>();

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<VerificationEvent> events = new ArrayList<>();

    public VerificationRun() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getOwnerSessionId() { return ownerSessionId; }
    public void setOwnerSessionId(String ownerSessionId) { this.ownerSessionId = ownerSessionId; }

    public InputType getInputType() { return inputType; }
    public void setInputType(InputType inputType) { this.inputType = inputType; }

    public String getOriginalInput() { return originalInput; }
    public void setOriginalInput(String originalInput) { this.originalInput = originalInput; }

    public String getContextText() { return contextText; }
    public void setContextText(String contextText) { this.contextText = contextText; }

    public String getGeneratedAnswer() { return generatedAnswer; }
    public void setGeneratedAnswer(String generatedAnswer) { this.generatedAnswer = generatedAnswer; }

    public String getGenerationModel() { return generationModel; }
    public void setGenerationModel(String generationModel) { this.generationModel = generationModel; }

    public RunMode getMode() { return mode; }
    public void setMode(RunMode mode) { this.mode = mode; }

    public boolean isReviewBeforeVerify() { return reviewBeforeVerify; }
    public void setReviewBeforeVerify(boolean reviewBeforeVerify) { this.reviewBeforeVerify = reviewBeforeVerify; }

    public RunStatus getStatus() { return status; }
    public void setStatus(RunStatus status) { this.status = status; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public String getOverallSummary() { return overallSummary; }
    public void setOverallSummary(String overallSummary) { this.overallSummary = overallSummary; }

    public String getSummaryMethod() { return summaryMethod; }
    public void setSummaryMethod(String summaryMethod) { this.summaryMethod = summaryMethod; }

    public String getWarningsJson() { return warningsJson; }
    public void setWarningsJson(String warningsJson) { this.warningsJson = warningsJson; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getLimitsSnapshotJson() { return limitsSnapshotJson; }
    public void setLimitsSnapshotJson(String limitsSnapshotJson) { this.limitsSnapshotJson = limitsSnapshotJson; }

    public String getInputHash() { return inputHash; }
    public void setInputHash(String inputHash) { this.inputHash = inputHash; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<Claim> getClaims() { return claims; }
    public void setClaims(List<Claim> claims) { this.claims = claims; }

    public List<EvidenceSource> getSources() { return sources; }
    public void setSources(List<EvidenceSource> sources) { this.sources = sources; }

    public List<VerificationEvent> getEvents() { return events; }
    public void setEvents(List<VerificationEvent> events) { this.events = events; }
}
