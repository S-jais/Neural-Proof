package com.neuralproof.dto;

import java.time.Instant;

public class HealthResponse {

    private String status;
    private String database;
    private String aiPipeline;
    private String tinyFish;
    private String llm;
    private Instant timestamp = Instant.now();

    public HealthResponse() {}

    public HealthResponse(String status, String database, String aiPipeline, String tinyFish, String llm) {
        this.status = status;
        this.database = database;
        this.aiPipeline = aiPipeline;
        this.tinyFish = tinyFish;
        this.llm = llm;
        this.timestamp = Instant.now();
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDatabase() { return database; }
    public void setDatabase(String database) { this.database = database; }

    public String getAiPipeline() { return aiPipeline; }
    public void setAiPipeline(String aiPipeline) { this.aiPipeline = aiPipeline; }

    public String getTinyFish() { return tinyFish; }
    public void setTinyFish(String tinyFish) { this.tinyFish = tinyFish; }

    public String getLlm() { return llm; }
    public void setLlm(String llm) { this.llm = llm; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
