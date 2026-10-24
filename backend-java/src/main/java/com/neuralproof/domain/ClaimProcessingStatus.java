package com.neuralproof.domain;

public enum ClaimProcessingStatus {
    PENDING,
    SEARCHING,
    FETCHING,
    EVALUATING,
    COMPLETED,
    RETRIEVAL_FAILED,
    EVALUATION_FAILED,
    EVALUATION_UNAVAILABLE,
    EXCLUDED,
    SKIPPED_LIMIT
}
