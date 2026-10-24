package com.neuralproof.dto;

import com.neuralproof.domain.ClaimProcessingStatus;
import com.neuralproof.domain.Verdict;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ClaimResponse {

    private UUID id;
    private int ordinal;
    private String claimKey;
    private String originalText;
    private String normalizedText;
    private Integer spanStart;
    private Integer spanEnd;
    private String claimType;
    private boolean isVerifiable;
    private String nonVerifiableReason;
    private boolean isTimeSensitive;
    private List<String> entities = new ArrayList<>();
    private String timeContext;
    private List<String> qualifiers = new ArrayList<>();
    private boolean included;
    private String exclusionReason;
    private ClaimProcessingStatus processingStatus;
    private Verdict verdict;
    private String confidenceLabel;
    private String confidenceBasis;
    private String explanation;
    private String verdictRationale;
    private String evidenceDirectness;
    private String temporalAssessment;
    private String claimAmbiguity;
    private List<String> unsupportedParts = new ArrayList<>();
    private List<String> neededQualifications = new ArrayList<>();
    private List<String> limitations = new ArrayList<>();
    private List<ClaimEvidenceResponse> evidence = new ArrayList<>();
    private String errorCode;
    private String errorMessage;
    private Instant createdAt;

    public ClaimResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public int getOrdinal() { return ordinal; }
    public void setOrdinal(int ordinal) { this.ordinal = ordinal; }

    public String getClaimKey() { return claimKey; }
    public void setClaimKey(String claimKey) { this.claimKey = claimKey; }

    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getNormalizedText() { return normalizedText; }
    public void setNormalizedText(String normalizedText) { this.normalizedText = normalizedText; }

    public Integer getSpanStart() { return spanStart; }
    public void setSpanStart(Integer spanStart) { this.spanStart = spanStart; }

    public Integer getSpanEnd() { return spanEnd; }
    public void setSpanEnd(Integer spanEnd) { this.spanEnd = spanEnd; }

    public String getClaimType() { return claimType; }
    public void setClaimType(String claimType) { this.claimType = claimType; }

    public boolean isVerifiable() { return isVerifiable; }
    public void setVerifiable(boolean verifiable) { isVerifiable = verifiable; }

    public String getNonVerifiableReason() { return nonVerifiableReason; }
    public void setNonVerifiableReason(String nonVerifiableReason) { this.nonVerifiableReason = nonVerifiableReason; }

    public boolean isTimeSensitive() { return isTimeSensitive; }
    public void setTimeSensitive(boolean timeSensitive) { isTimeSensitive = timeSensitive; }

    public List<String> getEntities() { return entities; }
    public void setEntities(List<String> entities) { this.entities = entities; }

    public String getTimeContext() { return timeContext; }
    public void setTimeContext(String timeContext) { this.timeContext = timeContext; }

    public List<String> getQualifiers() { return qualifiers; }
    public void setQualifiers(List<String> qualifiers) { this.qualifiers = qualifiers; }

    public boolean isIncluded() { return included; }
    public void setIncluded(boolean included) { this.included = included; }

    public String getExclusionReason() { return exclusionReason; }
    public void setExclusionReason(String exclusionReason) { this.exclusionReason = exclusionReason; }

    public ClaimProcessingStatus getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(ClaimProcessingStatus processingStatus) { this.processingStatus = processingStatus; }

    public Verdict getVerdict() { return verdict; }
    public void setVerdict(Verdict verdict) { this.verdict = verdict; }

    public String getConfidenceLabel() { return confidenceLabel; }
    public void setConfidenceLabel(String confidenceLabel) { this.confidenceLabel = confidenceLabel; }

    public String getConfidenceBasis() { return confidenceBasis; }
    public void setConfidenceBasis(String confidenceBasis) { this.confidenceBasis = confidenceBasis; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getVerdictRationale() { return verdictRationale; }
    public void setVerdictRationale(String verdictRationale) { this.verdictRationale = verdictRationale; }

    public String getEvidenceDirectness() { return evidenceDirectness; }
    public void setEvidenceDirectness(String evidenceDirectness) { this.evidenceDirectness = evidenceDirectness; }

    public String getTemporalAssessment() { return temporalAssessment; }
    public void setTemporalAssessment(String temporalAssessment) { this.temporalAssessment = temporalAssessment; }

    public String getClaimAmbiguity() { return claimAmbiguity; }
    public void setClaimAmbiguity(String claimAmbiguity) { this.claimAmbiguity = claimAmbiguity; }

    public List<String> getUnsupportedParts() { return unsupportedParts; }
    public void setUnsupportedParts(List<String> unsupportedParts) { this.unsupportedParts = unsupportedParts; }

    public List<String> getNeededQualifications() { return neededQualifications; }
    public void setNeededQualifications(List<String> neededQualifications) { this.neededQualifications = neededQualifications; }

    public List<String> getLimitations() { return limitations; }
    public void setLimitations(List<String> limitations) { this.limitations = limitations; }

    public List<ClaimEvidenceResponse> getEvidence() { return evidence; }
    public void setEvidence(List<ClaimEvidenceResponse> evidence) { this.evidence = evidence; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
