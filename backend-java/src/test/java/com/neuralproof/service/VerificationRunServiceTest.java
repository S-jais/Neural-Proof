package com.neuralproof.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuralproof.domain.*;
import com.neuralproof.dto.CreateVerificationRequest;
import com.neuralproof.dto.UpdateClaimReviewRequest;
import com.neuralproof.dto.VerificationResponse;
import com.neuralproof.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationRunServiceTest {

    @Mock
    private VerificationRunRepository runRepository;
    @Mock
    private ClaimRepository claimRepository;
    @Mock
    private EvidenceSourceRepository sourceRepository;
    @Mock
    private ClaimEvidenceRepository claimEvidenceRepository;
    @Mock
    private VerificationConflictRepository conflictRepository;
    @Mock
    private VerificationEventRepository eventRepository;

    private ObjectMapper objectMapper = new ObjectMapper();
    private VerificationRunService service;

    @BeforeEach
    void setUp() {
        service = new VerificationRunService(
                runRepository,
                claimRepository,
                sourceRepository,
                claimEvidenceRepository,
                conflictRepository,
                eventRepository,
                objectMapper
        );
    }

    @Test
    @DisplayName("createRun should create a new run when no duplicate exists")
    void testCreateRun_New() {
        CreateVerificationRequest req = new CreateVerificationRequest();
        req.setInputType(InputType.PASTED_ANSWER);
        req.setText("Solar panels generate clean electrical energy.");
        req.setReviewClaimsBeforeVerifying(true);

        when(runRepository.findRecentDuplicate(eq("sess-1"), anyString(), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        when(runRepository.save(any(VerificationRun.class))).thenAnswer(inv -> {
            VerificationRun r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        VerificationRun run = service.createRun(req, "sess-1", "corr-1");

        assertThat(run).isNotNull();
        assertThat(run.getStatus()).isEqualTo(RunStatus.QUEUED);
        assertThat(run.getOwnerSessionId()).isEqualTo("sess-1");
        assertThat(run.isReviewBeforeVerify()).isTrue();
        verify(eventRepository).save(any(VerificationEvent.class));
    }

    @Test
    @DisplayName("createRun should return existing run on duplicate submission within 60s")
    void testCreateRun_DuplicateWithin60s() {
        CreateVerificationRequest req = new CreateVerificationRequest();
        req.setInputType(InputType.PASTED_ANSWER);
        req.setText("Solar panels generate clean electrical energy.");

        VerificationRun existing = new VerificationRun();
        existing.setId(UUID.randomUUID());
        existing.setOwnerSessionId("sess-1");
        existing.setStatus(RunStatus.VERIFYING);

        when(runRepository.findRecentDuplicate(eq("sess-1"), anyString(), any(Instant.class)))
                .thenReturn(List.of(existing));

        VerificationRun run = service.createRun(req, "sess-1", "corr-1");

        assertThat(run.getId()).isEqualTo(existing.getId());
        verify(runRepository, never()).save(any(VerificationRun.class));
    }

    @Test
    @DisplayName("getRunForSession should enforce session ownership")
    void testGetRunForSession_OwnershipEnforced() {
        UUID runId = UUID.randomUUID();
        when(runRepository.findByIdAndOwnerSessionId(runId, "attacker-session"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getRunForSession(runId, "attacker-session"))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("updateClaimReview rejects changes when status is not AWAITING_CLAIM_REVIEW")
    void testUpdateClaimReview_ConflictWhenNotAwaitingReview() {
        UUID runId = UUID.randomUUID();
        UUID claimId = UUID.randomUUID();

        VerificationRun run = new VerificationRun();
        run.setId(runId);
        run.setOwnerSessionId("sess-1");
        run.setStatus(RunStatus.VERIFYING);

        when(runRepository.findByIdAndOwnerSessionId(runId, "sess-1"))
                .thenReturn(Optional.of(run));

        UpdateClaimReviewRequest req = new UpdateClaimReviewRequest();
        req.setIncluded(false);

        assertThatThrownBy(() -> service.updateClaimReview(runId, claimId, "sess-1", req))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("mapRunToDto deterministically aggregates verdicts and counts")
    void testMapRunToDto_DeterministicCounts() {
        UUID runId = UUID.randomUUID();
        VerificationRun run = new VerificationRun();
        run.setId(runId);
        run.setStatus(RunStatus.COMPLETED);
        run.setOverallSummary("Overall summary text");

        Claim c1 = new Claim();
        c1.setId(UUID.randomUUID());
        c1.setOrdinal(1);
        c1.setIncluded(true);
        c1.setVerdict(Verdict.SUPPORTED);
        c1.setProcessingStatus(ClaimProcessingStatus.COMPLETED);

        Claim c2 = new Claim();
        c2.setId(UUID.randomUUID());
        c2.setOrdinal(2);
        c2.setIncluded(true);
        c2.setVerdict(Verdict.CONTRADICTED);
        c2.setProcessingStatus(ClaimProcessingStatus.COMPLETED);

        Claim c3 = new Claim();
        c3.setId(UUID.randomUUID());
        c3.setOrdinal(3);
        c3.setIncluded(true);
        c3.setVerdict(Verdict.PARTIALLY_SUPPORTED);
        c3.setProcessingStatus(ClaimProcessingStatus.COMPLETED);

        Claim c4 = new Claim();
        c4.setId(UUID.randomUUID());
        c4.setOrdinal(4);
        c4.setIncluded(true);
        c4.setVerdict(Verdict.INSUFFICIENT_EVIDENCE);
        c4.setProcessingStatus(ClaimProcessingStatus.COMPLETED);

        Claim c5 = new Claim();
        c5.setId(UUID.randomUUID());
        c5.setOrdinal(5);
        c5.setIncluded(false);
        c5.setProcessingStatus(ClaimProcessingStatus.EXCLUDED);

        when(claimRepository.findByRunIdOrderByOrdinalAsc(runId))
                .thenReturn(List.of(c1, c2, c3, c4, c5));
        when(conflictRepository.findByRunId(runId))
                .thenReturn(Collections.emptyList());

        VerificationResponse resp = service.mapRunToDto(run);

        assertThat(resp.getCounts().get("totalClaims")).isEqualTo(5);
        assertThat(resp.getCounts().get("includedClaims")).isEqualTo(4);
        assertThat(resp.getCounts().get("supported")).isEqualTo(1);
        assertThat(resp.getCounts().get("contradicted")).isEqualTo(1);
        assertThat(resp.getCounts().get("partiallySupported")).isEqualTo(1);
        assertThat(resp.getCounts().get("insufficientEvidence")).isEqualTo(1);
        assertThat(resp.getCounts().get("notCompleted")).isEqualTo(0);
    }
}
