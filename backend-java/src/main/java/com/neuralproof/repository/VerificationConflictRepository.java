package com.neuralproof.repository;

import com.neuralproof.domain.VerificationConflict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VerificationConflictRepository extends JpaRepository<VerificationConflict, UUID> {
    List<VerificationConflict> findByRunId(UUID runId);
}
