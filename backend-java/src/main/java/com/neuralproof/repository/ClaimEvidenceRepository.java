package com.neuralproof.repository;

import com.neuralproof.domain.ClaimEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClaimEvidenceRepository extends JpaRepository<ClaimEvidence, UUID> {
    List<ClaimEvidence> findByClaimId(UUID claimId);
}
