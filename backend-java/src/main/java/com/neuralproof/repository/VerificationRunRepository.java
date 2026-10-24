package com.neuralproof.repository;

import com.neuralproof.domain.RunStatus;
import com.neuralproof.domain.VerificationRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationRunRepository extends JpaRepository<VerificationRun, UUID> {

    Optional<VerificationRun> findByIdAndOwnerSessionId(UUID id, String ownerSessionId);

    Page<VerificationRun> findByOwnerSessionId(String ownerSessionId, Pageable pageable);

    Page<VerificationRun> findByOwnerSessionIdAndStatus(String ownerSessionId, RunStatus status, Pageable pageable);

    // Duplicate detection: identical input hash within past 60 seconds
    @Query("SELECT r FROM VerificationRun r WHERE r.ownerSessionId = :sessionId AND r.inputHash = :hash AND r.createdAt >= :since ORDER BY r.createdAt DESC")
    List<VerificationRun> findRecentDuplicate(
            @Param("sessionId") String sessionId,
            @Param("hash") String hash,
            @Param("since") Instant since
    );

    // Watchdog: find runs that are in a non-terminal active state
    @Query("SELECT r FROM VerificationRun r WHERE r.status IN ('QUEUED', 'EXTRACTING_CLAIMS', 'VERIFYING', 'FINALIZING')")
    List<VerificationRun> findActiveRuns();
}
