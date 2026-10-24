package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "claims", uniqueConstraints = {
    @UniqueConstraint(name = "uq_run_ordinal", columnNames = {"run_id", "ordinal"})
}, indexes = {
    @Index(name = "idx_claims_run_verdict", columnList = "run_id, verdict")
})
public class Claim {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private VerificationRun run;

    @Column(nullable = false)
    private int ordinal;

    @Column(name = "claim_key", nullable = false, length = 32)
    private String claimKey;

    @Column(name = "original_text", nullable = false, columnDefinition = "TEXT")
    private String originalText;

    @Column(name = "normalized_text", nullable = false, columnDefinition = "TEXT")
    private String normalizedText;

    @Column(name = "span_start")
    private Integer spanStart;

    @Column(name = "span_end")
    private Integer spanEnd;

    @Column(name = "claim_type", nullable = false, length = 32)
    private String claimType;

    @Column(name = "is_verifiable", nullable = false)
    private boolean isVerifiable = true;

    @Column(name = "non_verifiable_reason", columnDefinition = "TEXT")
    private String nonVerifiableReason;

    @Column(name = "is_time_sensitive", nullable = false)
    private boolean isTimeSensitive = false;

    @Column(name = "entities", columnDefinition = "TEXT")
    private String entitiesJson;

    @Column(name = "time_context", columnDefinition = "TEXT")
    private String timeContextJson;

    @Column(name = "qualifiers", columnDefinition = "TEXT")
    private String qualifiersJson;

    @Column(name = "verification_queries", columnDefinition = "TEXT")
    private String verificationQueriesJson;

    @Column(nullable = false)
    private boolean included = true;

    @Column(name = "exclusion_reason", columnDefinition = "TEXT")
    private String exclusionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 32)
    private ClaimProcessingStatus processingStatus = ClaimProcessingStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private Verdict verdict;

    @Column(name = "confidence_label", length = 16)
    private String confidenceLabel;

    @Column(name = "confidence_basis", columnDefinition = "TEXT")
    private String confidenceBasis;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "verdict_rationale", columnDefinition = "TEXT")
    private String verdictRationale;

    @Column(name = "evidence_directness", length = 32)
    private String evidenceDirectness;

    @Column(name = "temporal_assessment", length = 32)
    private String temporalAssessment;

    @Column(name = "claim_ambiguity", length = 32)
    private String claimAmbiguity;

    @Column(name = "unsupported_parts", columnDefinition = "TEXT")
    private String unsupportedPartsJson;

    @Column(name = "needed_qualifications", columnDefinition = "TEXT")
    private String neededQualificationsJson;

    @Column(name = "limitations", columnDefinition = "TEXT")
    private String limitationsJson;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ClaimEvidence> evidence = new ArrayList<>();

    public Claim() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public VerificationRun getRun() { return run; }
    public void setRun(VerificationRun run) { this.run = run; }

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

    public String getEntitiesJson() { return entitiesJson; }
    public void setEntitiesJson(String entitiesJson) { this.entitiesJson = entitiesJson; }

    public String getTimeContextJson() { return timeContextJson; }
    public void setTimeContextJson(String timeContextJson) { this.timeContextJson = timeContextJson; }

    public String getQualifiersJson() { return qualifiersJson; }
    public void setQualifiersJson(String qualifiersJson) { this.qualifiersJson = qualifiersJson; }

    public String getVerificationQueriesJson() { return verificationQueriesJson; }
    public void setVerificationQueriesJson(String verificationQueriesJson) { this.verificationQueriesJson = verificationQueriesJson; }

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

    public String getUnsupportedPartsJson() { return unsupportedPartsJson; }
    public void setUnsupportedPartsJson(String unsupportedPartsJson) { this.unsupportedPartsJson = unsupportedPartsJson; }

    public String getNeededQualificationsJson() { return neededQualificationsJson; }
    public void setNeededQualificationsJson(String neededQualificationsJson) { this.neededQualificationsJson = neededQualificationsJson; }

    public String getLimitationsJson() { return limitationsJson; }
    public void setLimitationsJson(String limitationsJson) { this.limitationsJson = limitationsJson; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<ClaimEvidence> getEvidence() { return evidence; }
    public void setEvidence(List<ClaimEvidence> evidence) { this.evidence = evidence; }
}
