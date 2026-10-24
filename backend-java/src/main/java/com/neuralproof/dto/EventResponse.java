package com.neuralproof.dto;

import java.time.Instant;
import java.util.UUID;

public class EventResponse {

    private UUID id;
    private UUID claimId;
    private String stage;
    private String level;
    private String message;
    private Instant createdAt;

    public EventResponse() {}

    public EventResponse(UUID id, UUID claimId, String stage, String level, String message, Instant createdAt) {
        this.id = id;
        this.claimId = claimId;
        this.stage = stage;
        this.level = level;
        this.message = message;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getClaimId() { return claimId; }
    public void setClaimId(UUID claimId) { this.claimId = claimId; }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
