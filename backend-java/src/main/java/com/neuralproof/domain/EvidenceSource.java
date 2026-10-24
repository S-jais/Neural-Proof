package com.neuralproof.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "evidence_sources", uniqueConstraints = {
    @UniqueConstraint(name = "uq_run_normalized_url", columnNames = {"run_id", "normalized_url"})
})
public class EvidenceSource {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private VerificationRun run;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "normalized_url", nullable = false, columnDefinition = "TEXT")
    private String normalizedUrl;

    @Column(nullable = false, length = 255)
    private String domain;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String publisher;

    @Column(name = "source_class", nullable = false, length = 64)
    private String sourceClass;

    @Column(name = "quality_assessment", columnDefinition = "TEXT")
    private String qualityAssessmentJson;

    @Column(name = "publication_date", length = 64)
    private String publicationDate;

    @Column(name = "last_updated_date", length = 64)
    private String lastUpdatedDate;

    @Column(name = "date_origin", length = 32)
    private String dateOrigin;

    @Column(name = "retrieved_at", nullable = false)
    private Instant retrievedAt = Instant.now();

    @Column(name = "retrieval_method", nullable = false, length = 32)
    private String retrievalMethod;

    @Column(name = "retrieval_status", nullable = false, length = 32)
    private String retrievalStatus;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(columnDefinition = "TEXT")
    private String snippet;

    @Column(name = "content_text", columnDefinition = "TEXT")
    private String contentText;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "content_char_count")
    private int contentCharCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "source", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ClaimEvidence> evidence = new ArrayList<>();

    public EvidenceSource() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public VerificationRun getRun() { return run; }
    public void setRun(VerificationRun run) { this.run = run; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getNormalizedUrl() { return normalizedUrl; }
    public void setNormalizedUrl(String normalizedUrl) { this.normalizedUrl = normalizedUrl; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }

    public String getSourceClass() { return sourceClass; }
    public void setSourceClass(String sourceClass) { this.sourceClass = sourceClass; }

    public String getQualityAssessmentJson() { return qualityAssessmentJson; }
    public void setQualityAssessmentJson(String qualityAssessmentJson) { this.qualityAssessmentJson = qualityAssessmentJson; }

    public String getPublicationDate() { return publicationDate; }
    public void setPublicationDate(String publicationDate) { this.publicationDate = publicationDate; }

    public String getLastUpdatedDate() { return lastUpdatedDate; }
    public void setLastUpdatedDate(String lastUpdatedDate) { this.lastUpdatedDate = lastUpdatedDate; }

    public String getDateOrigin() { return dateOrigin; }
    public void setDateOrigin(String dateOrigin) { this.dateOrigin = dateOrigin; }

    public Instant getRetrievedAt() { return retrievedAt; }
    public void setRetrievedAt(Instant retrievedAt) { this.retrievedAt = retrievedAt; }

    public String getRetrievalMethod() { return retrievalMethod; }
    public void setRetrievalMethod(String retrievalMethod) { this.retrievalMethod = retrievalMethod; }

    public String getRetrievalStatus() { return retrievalStatus; }
    public void setRetrievalStatus(String retrievalStatus) { this.retrievalStatus = retrievalStatus; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getSnippet() { return snippet; }
    public void setSnippet(String snippet) { this.snippet = snippet; }

    public String getContentText() { return contentText; }
    public void setContentText(String contentText) { this.contentText = contentText; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public int getContentCharCount() { return contentCharCount; }
    public void setContentCharCount(int contentCharCount) { this.contentCharCount = contentCharCount; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<ClaimEvidence> getEvidence() { return evidence; }
    public void setEvidence(List<ClaimEvidence> evidence) { this.evidence = evidence; }
}
