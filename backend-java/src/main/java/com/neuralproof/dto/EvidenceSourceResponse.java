package com.neuralproof.dto;

import java.time.Instant;
import java.util.UUID;

public class EvidenceSourceResponse {

    private UUID id;
    private String url;
    private String normalizedUrl;
    private String domain;
    private String title;
    private String publisher;
    private String sourceClass;
    private String publicationDate;
    private String lastUpdatedDate;
    private String dateOrigin;
    private Instant retrievedAt;
    private String retrievalMethod;
    private String retrievalStatus;
    private String failureReason;
    private String snippet;
    private int contentCharCount;

    public EvidenceSourceResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public int getContentCharCount() { return contentCharCount; }
    public void setContentCharCount(int contentCharCount) { this.contentCharCount = contentCharCount; }
}
