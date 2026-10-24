package com.neuralproof.dto;

import java.util.List;
import java.util.UUID;

public class StartVerificationRequest {
    private List<UUID> includedClaimIds;

    public StartVerificationRequest() {}

    public List<UUID> getIncludedClaimIds() { return includedClaimIds; }
    public void setIncludedClaimIds(List<UUID> includedClaimIds) { this.includedClaimIds = includedClaimIds; }
}
