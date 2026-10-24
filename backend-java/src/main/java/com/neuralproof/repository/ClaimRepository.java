package com.neuralproof.repository;

import com.neuralproof.domain.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, UUID> {
    List<Claim> findByRunIdOrderByOrdinalAsc(UUID runId);
    Optional<Claim> findByIdAndRunId(UUID id, UUID runId);
}
