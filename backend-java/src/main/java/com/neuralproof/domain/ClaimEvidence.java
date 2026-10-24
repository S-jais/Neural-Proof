package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "claim_evidence", uniqueConstraints = {
    @UniqueConstraint(name = "uq_claim_source_passage", columnNames = {"claim_id", "source_id", "passage_id"})
})
public class ClaimEvidence {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "source_id", nullable = false)
    private EvidenceSource source;

    @Column(name = "passage_id", nullable = false, length = 32)
    private String passageId;

    @Column(name = "passage_text", nullable = false, columnDefinition = "TEXT")
    private String passageText;

    @Column(name = "char_start")
    private Integer charStart;

    @Column(name = "char_end")
    private Integer charEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EvidenceStance stance = EvidenceStance.NOT_CITED;

    @Column(name = "relevance_score")
    private Double relevanceScore;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "used_in_verdict", nullable = false)
    private boolean usedInVerdict = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ClaimEvidence() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Claim getClaim() { return claim; }
    public void setClaim(Claim claim) { this.claim = claim; }

    public EvidenceSource getSource() { return source; }
    public void setSource(EvidenceSource source) { this.source = source; }

    public String getPassageId() { return passageId; }
    public void setPassageId(String passageId) { this.passageId = passageId; }

    public String getPassageText() { return passageText; }
    public void setPassageText(String passageText) { this.passageText = passageText; }

    public Integer getCharStart() { return charStart; }
    public void setCharStart(Integer charStart) { this.charStart = charStart; }

    public Integer getCharEnd() { return charEnd; }
    public void setCharEnd(Integer charEnd) { this.charEnd = charEnd; }

    public EvidenceStance getStance() { return stance; }
    public void setStance(EvidenceStance stance) { this.stance = stance; }

    public Double getRelevanceScore() { return relevanceScore; }
    public void setRelevanceScore(Double relevanceScore) { this.relevanceScore = relevanceScore; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public boolean isUsedInVerdict() { return usedInVerdict; }
    public void setUsedInVerdict(boolean usedInVerdict) { this.usedInVerdict = usedInVerdict; }

    public Instant getCreatedAt() { return createdAt; }
}
