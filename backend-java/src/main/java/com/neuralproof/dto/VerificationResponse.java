package com.neuralproof.dto;

import com.neuralproof.domain.InputType;
import com.neuralproof.domain.RunMode;
import com.neuralproof.domain.RunStatus;

import java.time.Instant;
import java.util.*;

public class VerificationResponse {

    private UUID id;
    private RunStatus status;
    private String currentStage;
    private RunMode mode;
    private InputType inputType;
    private String originalInput;
    private String contextText;
    private String generatedAnswer;
    private String generationModel;
    private boolean reviewBeforeVerify;

    private Map<String, Object> summary = new HashMap<>();
    private Map<String, Integer> counts = new HashMap<>();
    private List<ClaimResponse> claims = new ArrayList<>();
    private List<ConflictResponse> conflicts = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    private String errorCode;
    private String errorMessage;

    private Instant startedAt;
    private Instant completedAt;
    private Long durationMs;
    private Instant createdAt;

    public VerificationResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public RunStatus getStatus() { return status; }
    public void setStatus(RunStatus status) { this.status = status; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public RunMode getMode() { return mode; }
    public void setMode(RunMode mode) { this.mode = mode; }

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

    public boolean isReviewBeforeVerify() { return reviewBeforeVerify; }
    public void setReviewBeforeVerify(boolean reviewBeforeVerify) { this.reviewBeforeVerify = reviewBeforeVerify; }

    public Map<String, Object> getSummary() { return summary; }
    public void setSummary(Map<String, Object> summary) { this.summary = summary; }

    public Map<String, Integer> getCounts() { return counts; }
    public void setCounts(Map<String, Integer> counts) { this.counts = counts; }

    public List<ClaimResponse> getClaims() { return claims; }
    public void setClaims(List<ClaimResponse> claims) { this.claims = claims; }

    public List<ConflictResponse> getConflicts() { return conflicts; }
    public void setConflicts(List<ConflictResponse> conflicts) { this.conflicts = conflicts; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
