package com.neuralproof.dto;

import com.neuralproof.domain.EvidenceStance;

import java.util.UUID;

public class ClaimEvidenceResponse {

    private UUID id;
    private String passageId;
    private String passageText;
    private Integer charStart;
    private Integer charEnd;
    private EvidenceStance stance;
    private Double relevanceScore;
    private String note;
    private boolean usedInVerdict;

    // Associated Source Details
    private UUID sourceId;
    private String sourceUrl;
    private String sourceDomain;
    private String sourceTitle;
    private String sourceClass;
    private String publicationDate;
    private String lastUpdatedDate;
    private String retrievalMethod;

    public ClaimEvidenceResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public UUID getSourceId() { return sourceId; }
    public void setSourceId(UUID sourceId) { this.sourceId = sourceId; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getSourceDomain() { return sourceDomain; }
    public void setSourceDomain(String sourceDomain) { this.sourceDomain = sourceDomain; }

    public String getSourceTitle() { return sourceTitle; }
    public void setSourceTitle(String sourceTitle) { this.sourceTitle = sourceTitle; }

    public String getSourceClass() { return sourceClass; }
    public void setSourceClass(String sourceClass) { this.sourceClass = sourceClass; }

    public String getPublicationDate() { return publicationDate; }
    public void setPublicationDate(String publicationDate) { this.publicationDate = publicationDate; }

    public String getLastUpdatedDate() { return lastUpdatedDate; }
    public void setLastUpdatedDate(String lastUpdatedDate) { this.lastUpdatedDate = lastUpdatedDate; }

    public String getRetrievalMethod() { return retrievalMethod; }
    public void setRetrievalMethod(String retrievalMethod) { this.retrievalMethod = retrievalMethod; }
}
