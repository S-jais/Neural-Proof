package com.neuralproof.domain;

public enum RunStatus {
    QUEUED,
    EXTRACTING_CLAIMS,
    AWAITING_CLAIM_REVIEW,
    VERIFYING,
    FINALIZING,
    COMPLETED,
    PARTIAL,
    FAILED,
    TIMED_OUT
}
