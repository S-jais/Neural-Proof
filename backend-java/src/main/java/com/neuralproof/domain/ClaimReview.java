package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "claim_reviews")
public class ClaimReview {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @Column(name = "owner_session_id", nullable = false)
    private String ownerSessionId;

    @Column(name = "reviewed_verdict", length = 32)
    private String reviewedVerdict;

    @Column(name = "evidence_relevant")
    private Boolean evidenceRelevant;

    @Column(name = "citation_supports_claim")
    private Boolean citationSupportsClaim;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ClaimReview() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Claim getClaim() { return claim; }
    public void setClaim(Claim claim) { this.claim = claim; }

    public String getOwnerSessionId() { return ownerSessionId; }
    public void setOwnerSessionId(String ownerSessionId) { this.ownerSessionId = ownerSessionId; }

    public String getReviewedVerdict() { return reviewedVerdict; }
    public void setReviewedVerdict(String reviewedVerdict) { this.reviewedVerdict = reviewedVerdict; }

    public Boolean getEvidenceRelevant() { return evidenceRelevant; }
    public void setEvidenceRelevant(Boolean evidenceRelevant) { this.evidenceRelevant = evidenceRelevant; }

    public Boolean getCitationSupportsClaim() { return citationSupportsClaim; }
    public void setCitationSupportsClaim(Boolean citationSupportsClaim) { this.citationSupportsClaim = citationSupportsClaim; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
}
