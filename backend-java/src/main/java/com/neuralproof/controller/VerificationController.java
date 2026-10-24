package com.neuralproof.controller;

import com.neuralproof.domain.RunStatus;
import com.neuralproof.domain.VerificationRun;
import com.neuralproof.dto.*;
import com.neuralproof.security.CorrelationFilter;
import com.neuralproof.security.SessionManager;
import com.neuralproof.service.VerificationOrchestrator;
import com.neuralproof.service.VerificationRunService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/verifications")
@Tag(name = "Verifications", description = "Public verification operations")
public class VerificationController {

    private final VerificationRunService runService;
    private final VerificationOrchestrator orchestrator;
    private final SessionManager sessionManager;

    public VerificationController(
            VerificationRunService runService,
            VerificationOrchestrator orchestrator,
            SessionManager sessionManager
    ) {
        this.runService = runService;
        this.orchestrator = orchestrator;
        this.sessionManager = sessionManager;
    }

    private String getSessionId(HttpServletRequest request, HttpServletResponse response) {
        return sessionManager.getOrCreateSessionId(request, response);
    }

    private String getCorrelationId() {
        String cid = MDC.get(CorrelationFilter.MDC_KEY);
        return cid != null ? cid : UUID.randomUUID().toString();
    }

    @PostMapping
    @Operation(summary = "Create a new verification run")
    public ResponseEntity<Map<String, Object>> createVerification(
            @Valid @RequestBody CreateVerificationRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        String correlationId = getCorrelationId();

        VerificationRun run = runService.createRun(req, sessionId, correlationId);

        // If newly created run (status is QUEUED), kick off async pipeline
        if (run.getStatus() == RunStatus.QUEUED) {
            orchestrator.startPipelineAsync(run.getId(), correlationId);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("verificationId", run.getId());
        body.put("status", run.getStatus());
        body.put("mode", run.getMode());
        body.put("createdAt", run.getCreatedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get verification run details or full report")
    public ResponseEntity<VerificationResponse> getVerification(
            @PathVariable UUID id,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        VerificationRun run = runService.getRunForSession(id, sessionId);
        return ResponseEntity.ok(runService.mapRunToDto(run));
    }

    @GetMapping("/{id}/claims")
    @Operation(summary = "Get claims for a verification run")
    public ResponseEntity<List<ClaimResponse>> getClaims(
            @PathVariable UUID id,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        return ResponseEntity.ok(runService.getClaims(id, sessionId));
    }

    @PatchMapping("/{id}/claims/{claimId}")
    @Operation(summary = "Include or exclude a claim during review")
    public ResponseEntity<ClaimResponse> updateClaimReview(
            @PathVariable UUID id,
            @PathVariable UUID claimId,
            @RequestBody UpdateClaimReviewRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        return ResponseEntity.ok(runService.updateClaimReview(id, claimId, sessionId, req));
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Resume verification pipeline after claim review")
    public ResponseEntity<Map<String, Object>> startVerificationAfterReview(
            @PathVariable UUID id,
            @RequestBody(required = false) StartVerificationRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        String correlationId = getCorrelationId();

        VerificationRun run = runService.getRunForSession(id, sessionId);
        List<UUID> includedIds = req != null ? req.getIncludedClaimIds() : null;

        orchestrator.resumeVerificationAfterReview(run.getId(), includedIds, correlationId);

        Map<String, Object> body = new HashMap<>();
        body.put("verificationId", run.getId());
        body.put("status", RunStatus.VERIFYING);
        body.put("message", "Verification pipeline resumed.");
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @GetMapping("/{id}/sources")
    @Operation(summary = "Get evidence sources with provenance")
    public ResponseEntity<List<EvidenceSourceResponse>> getSources(
            @PathVariable UUID id,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        return ResponseEntity.ok(runService.getSources(id, sessionId));
    }

    @GetMapping("/{id}/events")
    @Operation(summary = "Get progress events feed")
    public ResponseEntity<List<EventResponse>> getEvents(
            @PathVariable UUID id,
            @RequestParam(required = false) String after,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        Instant afterInstant = null;
        if (after != null && !after.isBlank()) {
            try {
                afterInstant = Instant.parse(after);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(runService.getEvents(id, sessionId, afterInstant));
    }

    @GetMapping
    @Operation(summary = "Get paginated verification history for session")
    public ResponseEntity<Page<VerificationResponse>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) RunStatus status,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        int pageSize = Math.min(Math.max(1, size), 50);
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<VerificationRun> runPage = runService.getHistory(sessionId, status, pageRequest);
        return ResponseEntity.ok(runPage.map(runService::mapRunToDto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a verification run owned by session")
    public ResponseEntity<Void> deleteRun(
            @PathVariable UUID id,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String sessionId = getSessionId(request, response);
        runService.deleteRun(id, sessionId);
        return ResponseEntity.noContent().build();
    }
}
