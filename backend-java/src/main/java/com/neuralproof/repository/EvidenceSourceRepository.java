package com.neuralproof.repository;

import com.neuralproof.domain.EvidenceSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvidenceSourceRepository extends JpaRepository<EvidenceSource, UUID> {
    List<EvidenceSource> findByRunId(UUID runId);
    Optional<EvidenceSource> findByRunIdAndNormalizedUrl(UUID runId, String normalizedUrl);
}
