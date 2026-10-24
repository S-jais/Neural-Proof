package com.neuralproof.repository;

import com.neuralproof.domain.VerificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface VerificationEventRepository extends JpaRepository<VerificationEvent, UUID> {
    List<VerificationEvent> findByRunIdOrderByCreatedAtAsc(UUID runId);

    @Query("SELECT e FROM VerificationEvent e WHERE e.run.id = :runId AND e.createdAt > :after ORDER BY e.createdAt ASC")
    List<VerificationEvent> findByRunIdAndCreatedAtAfter(@Param("runId") UUID runId, @Param("after") Instant after);
}
