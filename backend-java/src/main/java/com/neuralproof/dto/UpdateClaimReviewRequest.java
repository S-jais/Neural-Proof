package com.neuralproof.dto;

public class UpdateClaimReviewRequest {
    private Boolean included;
    private String exclusionReason;

    public UpdateClaimReviewRequest() {}

    public Boolean getIncluded() { return included; }
    public void setIncluded(Boolean included) { this.included = included; }

    public String getExclusionReason() { return exclusionReason; }
    public void setExclusionReason(String exclusionReason) { this.exclusionReason = exclusionReason; }
}
