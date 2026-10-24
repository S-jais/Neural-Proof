package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verification_conflicts")
public class VerificationConflict {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private VerificationRun run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @Column(name = "conflict_type", nullable = false, length = 64)
    private String conflictType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "side_a_evidence_ids", columnDefinition = "TEXT")
    private String sideAEvidenceIdsJson;

    @Column(name = "side_b_evidence_ids", columnDefinition = "TEXT")
    private String sideBEvidenceIdsJson;

    @Column(nullable = false, length = 32)
    private String resolution;

    @Column(name = "resolution_basis", columnDefinition = "TEXT")
    private String resolutionBasis;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public VerificationConflict() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public VerificationRun getRun() { return run; }
    public void setRun(VerificationRun run) { this.run = run; }

    public Claim getClaim() { return claim; }
    public void setClaim(Claim claim) { this.claim = claim; }

    public String getConflictType() { return conflictType; }
    public void setConflictType(String conflictType) { this.conflictType = conflictType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSideAEvidenceIdsJson() { return sideAEvidenceIdsJson; }
    public void setSideAEvidenceIdsJson(String sideAEvidenceIdsJson) { this.sideAEvidenceIdsJson = sideAEvidenceIdsJson; }

    public String getSideBEvidenceIdsJson() { return sideBEvidenceIdsJson; }
    public void setSideBEvidenceIdsJson(String sideBEvidenceIdsJson) { this.sideBEvidenceIdsJson = sideBEvidenceIdsJson; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public String getResolutionBasis() { return resolutionBasis; }
    public void setResolutionBasis(String resolutionBasis) { this.resolutionBasis = resolutionBasis; }

    public Instant getCreatedAt() { return createdAt; }
}
