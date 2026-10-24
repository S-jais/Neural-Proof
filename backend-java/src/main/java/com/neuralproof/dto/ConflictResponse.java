package com.neuralproof.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ConflictResponse {

    private UUID id;
    private UUID claimId;
    private String conflictType;
    private String description;
    private List<String> sideAPassageIds;
    private List<String> sideBPassageIds;
    private String resolution;
    private String resolutionBasis;
    private Instant createdAt;

    public ConflictResponse() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClaimId() { return claimId; }
    public void setClaimId(UUID claimId) { this.claimId = claimId; }

    public String getConflictType() { return conflictType; }
    public void setConflictType(String conflictType) { this.conflictType = conflictType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getSideAPassageIds() { return sideAPassageIds; }
    public void setSideAPassageIds(List<String> sideAPassageIds) { this.sideAPassageIds = sideAPassageIds; }

    public List<String> getSideBPassageIds() { return sideBPassageIds; }
    public void setSideBPassageIds(List<String> sideBPassageIds) { this.sideBPassageIds = sideBPassageIds; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public String getResolutionBasis() { return resolutionBasis; }
    public void setResolutionBasis(String resolutionBasis) { this.resolutionBasis = resolutionBasis; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
