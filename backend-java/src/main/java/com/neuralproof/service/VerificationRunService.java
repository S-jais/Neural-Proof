package com.neuralproof.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuralproof.domain.*;
import com.neuralproof.dto.*;
import com.neuralproof.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VerificationRunService {

    private static final Logger log = LoggerFactory.getLogger(VerificationRunService.class);

    private final VerificationRunRepository runRepository;
    private final ClaimRepository claimRepository;
    private final EvidenceSourceRepository sourceRepository;
    private final ClaimEvidenceRepository claimEvidenceRepository;
    private final VerificationConflictRepository conflictRepository;
    private final VerificationEventRepository eventRepository;
    private final ObjectMapper objectMapper;

    public VerificationRunService(
            VerificationRunRepository runRepository,
            ClaimRepository claimRepository,
            EvidenceSourceRepository sourceRepository,
            ClaimEvidenceRepository claimEvidenceRepository,
            VerificationConflictRepository conflictRepository,
            VerificationEventRepository eventRepository,
            ObjectMapper objectMapper
    ) {
        this.runRepository = runRepository;
        this.claimRepository = claimRepository;
        this.sourceRepository = sourceRepository;
        this.claimEvidenceRepository = claimEvidenceRepository;
        this.conflictRepository = conflictRepository;
        this.eventRepository = eventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public VerificationRun createRun(CreateVerificationRequest req, String sessionId, String correlationId) {
        String cleanText = req.getText().trim();
        String inputHash = computeSha256(cleanText + (req.getContext() != null ? req.getContext().trim() : ""));

        // Duplicate submission check within 60 seconds (Part C1)
        Instant since = Instant.now().minusSeconds(60);
        List<VerificationRun> duplicates = runRepository.findRecentDuplicate(sessionId, inputHash, since);
        if (!duplicates.isEmpty()) {
            log.info("Duplicate submission detected within 60s for session {}. Reusing run {}", sessionId, duplicates.get(0).getId());
            return duplicates.get(0);
        }

        VerificationRun run = new VerificationRun();
        run.setOwnerSessionId(sessionId);
        run.setInputType(req.getInputType());
        run.setOriginalInput(cleanText);
        run.setContextText(req.getContext() != null ? req.getContext().trim() : null);
        run.setReviewBeforeVerify(req.getReviewClaimsBeforeVerifying() != null ? req.getReviewClaimsBeforeVerifying() : true);
        run.setStatus(RunStatus.QUEUED);
        run.setInputHash(inputHash);
        run.setStartedAt(Instant.now());

        run = runRepository.save(run);

        recordEvent(run, null, "INITIALIZE", "INFO", "Verification run created and queued.");
        return run;
    }

    @Transactional(readOnly = true)
    public VerificationRun getRunForSession(UUID id, String sessionId) {
        return runRepository.findByIdAndOwnerSessionId(id, sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification run not found"));
    }

    @Transactional(readOnly = true)
    public Page<VerificationRun> getHistory(String sessionId, RunStatus status, Pageable pageable) {
        if (status != null) {
            return runRepository.findByOwnerSessionIdAndStatus(sessionId, status, pageable);
        }
        return runRepository.findByOwnerSessionId(sessionId, pageable);
    }

    @Transactional
    public void deleteRun(UUID id, String sessionId) {
        VerificationRun run = getRunForSession(id, sessionId);
        runRepository.delete(run);
    }

    @Transactional
    public void recordEvent(VerificationRun run, UUID claimId, String stage, String level, String message) {
        VerificationEvent event = new VerificationEvent(run, claimId, stage, level, message, null);
        eventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getEvents(UUID runId, String sessionId, Instant after) {
        // Enforce ownership
        getRunForSession(runId, sessionId);

        List<VerificationEvent> events;
        if (after != null) {
            events = eventRepository.findByRunIdAndCreatedAtAfter(runId, after);
        } else {
            events = eventRepository.findByRunIdOrderByCreatedAtAsc(runId);
        }

        return events.stream()
                .map(e -> new EventResponse(e.getId(), e.getClaimId(), e.getStage(), e.getLevel(), e.getMessage(), e.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EvidenceSourceResponse> getSources(UUID runId, String sessionId) {
        getRunForSession(runId, sessionId);
        return sourceRepository.findByRunId(runId).stream()
                .map(this::mapSourceToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaims(UUID runId, String sessionId) {
        getRunForSession(runId, sessionId);
        return claimRepository.findByRunIdOrderByOrdinalAsc(runId).stream()
                .map(this::mapClaimToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClaimResponse updateClaimReview(UUID runId, UUID claimId, String sessionId, UpdateClaimReviewRequest req) {
        VerificationRun run = getRunForSession(runId, sessionId);
        if (run.getStatus() != RunStatus.AWAITING_CLAIM_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Claim review modifications only allowed in AWAITING_CLAIM_REVIEW status");
        }

        Claim claim = claimRepository.findByIdAndRunId(claimId, runId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        if (req.getIncluded() != null) {
            claim.setIncluded(req.getIncluded());
            claim.setProcessingStatus(req.getIncluded() ? ClaimProcessingStatus.PENDING : ClaimProcessingStatus.EXCLUDED);
        }
        if (req.getExclusionReason() != null) {
            claim.setExclusionReason(req.getExclusionReason());
        }

        claim.setUpdatedAt(Instant.now());
        claim = claimRepository.save(claim);
        return mapClaimToDto(claim);
    }

    @Transactional(readOnly = true)
    public VerificationResponse getRunDto(UUID id, String sessionId) {
        VerificationRun run = getRunForSession(id, sessionId);
        return mapRunToDto(run);
    }

    @Transactional(readOnly = true)
    public VerificationResponse mapRunToDto(VerificationRun run) {
        VerificationResponse resp = new VerificationResponse();
        resp.setId(run.getId());
        resp.setStatus(run.getStatus());
        resp.setCurrentStage(run.getCurrentStage());
        resp.setMode(run.getMode());
        resp.setInputType(run.getInputType());
        resp.setOriginalInput(run.getOriginalInput());
        resp.setContextText(run.getContextText());
        resp.setGeneratedAnswer(run.getGeneratedAnswer());
        resp.setGenerationModel(run.getGenerationModel());
        resp.setReviewBeforeVerify(run.isReviewBeforeVerify());
        resp.setErrorCode(run.getErrorCode());
        resp.setErrorMessage(run.getErrorMessage());
        resp.setStartedAt(run.getStartedAt());
        resp.setCompletedAt(run.getCompletedAt());
        resp.setDurationMs(run.getDurationMs());
        resp.setCreatedAt(run.getCreatedAt());

        // Claims
        List<Claim> claims = claimRepository.findByRunIdOrderByOrdinalAsc(run.getId());
        resp.setClaims(claims.stream().map(this::mapClaimToDto).collect(Collectors.toList()));

        // Counts
        int total = claims.size();
        int included = (int) claims.stream().filter(Claim::isIncluded).count();
        int supported = (int) claims.stream().filter(c -> c.getVerdict() == Verdict.SUPPORTED).count();
        int contradicted = (int) claims.stream().filter(c -> c.getVerdict() == Verdict.CONTRADICTED).count();
        int partial = (int) claims.stream().filter(c -> c.getVerdict() == Verdict.PARTIALLY_SUPPORTED).count();
        int insufficient = (int) claims.stream().filter(c -> c.getVerdict() == Verdict.INSUFFICIENT_EVIDENCE).count();
        int notCompleted = (int) claims.stream().filter(c -> c.isIncluded() && c.getProcessingStatus() != ClaimProcessingStatus.COMPLETED).count();

        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("totalClaims", total);
        counts.put("includedClaims", included);
        counts.put("supported", supported);
        counts.put("contradicted", contradicted);
        counts.put("partiallySupported", partial);
        counts.put("insufficientEvidence", insufficient);
        counts.put("notCompleted", notCompleted);
        resp.setCounts(counts);

        // Summary
        Map<String, Object> summaryMap = new HashMap<>();
        summaryMap.put("text", run.getOverallSummary());
        summaryMap.put("method", run.getSummaryMethod());
        resp.setSummary(summaryMap);

        // Conflicts
        List<VerificationConflict> conflicts = conflictRepository.findByRunId(run.getId());
        resp.setConflicts(conflicts.stream().map(this::mapConflictToDto).collect(Collectors.toList()));

        return resp;
    }

    public ClaimResponse mapClaimToDto(Claim c) {
        ClaimResponse dto = new ClaimResponse();
        dto.setId(c.getId());
        dto.setOrdinal(c.getOrdinal());
        dto.setClaimKey(c.getClaimKey());
        dto.setOriginalText(c.getOriginalText());
        dto.setNormalizedText(c.getNormalizedText());
        dto.setSpanStart(c.getSpanStart());
        dto.setSpanEnd(c.getSpanEnd());
        dto.setClaimType(c.getClaimType());
        dto.setVerifiable(c.isVerifiable());
        dto.setNonVerifiableReason(c.getNonVerifiableReason());
        dto.setTimeSensitive(c.isTimeSensitive());
        dto.setIncluded(c.isIncluded());
        dto.setExclusionReason(c.getExclusionReason());
        dto.setProcessingStatus(c.getProcessingStatus());
        dto.setVerdict(c.getVerdict());
        dto.setConfidenceLabel(c.getConfidenceLabel());
        dto.setConfidenceBasis(c.getConfidenceBasis());
        dto.setExplanation(c.getExplanation());
        dto.setVerdictRationale(c.getVerdictRationale());
        dto.setEvidenceDirectness(c.getEvidenceDirectness());
        dto.setTemporalAssessment(c.getTemporalAssessment());
        dto.setClaimAmbiguity(c.getClaimAmbiguity());
        dto.setErrorCode(c.getErrorCode());
        dto.setErrorMessage(c.getErrorMessage());
        dto.setCreatedAt(c.getCreatedAt());

        // Evidence passages
        List<ClaimEvidence> evidenceList = claimEvidenceRepository.findByClaimId(c.getId());
        dto.setEvidence(evidenceList.stream().map(this::mapClaimEvidenceToDto).collect(Collectors.toList()));

        return dto;
    }

    public ClaimEvidenceResponse mapClaimEvidenceToDto(ClaimEvidence e) {
        ClaimEvidenceResponse dto = new ClaimEvidenceResponse();
        dto.setId(e.getId());
        dto.setPassageId(e.getPassageId());
        dto.setPassageText(e.getPassageText());
        dto.setCharStart(e.getCharStart());
        dto.setCharEnd(e.getCharEnd());
        dto.setStance(e.getStance());
        dto.setRelevanceScore(e.getRelevanceScore());
        dto.setNote(e.getNote());
        dto.setUsedInVerdict(e.isUsedInVerdict());

        if (e.getSource() != null) {
            EvidenceSource s = e.getSource();
            dto.setSourceId(s.getId());
            dto.setSourceUrl(s.getUrl());
            dto.setSourceDomain(s.getDomain());
            dto.setSourceTitle(s.getTitle());
            dto.setSourceClass(s.getSourceClass());
            dto.setPublicationDate(s.getPublicationDate());
            dto.setLastUpdatedDate(s.getLastUpdatedDate());
            dto.setRetrievalMethod(s.getRetrievalMethod());
        }

        return dto;
    }

    public EvidenceSourceResponse mapSourceToDto(EvidenceSource s) {
        EvidenceSourceResponse dto = new EvidenceSourceResponse();
        dto.setId(s.getId());
        dto.setUrl(s.getUrl());
        dto.setNormalizedUrl(s.getNormalizedUrl());
        dto.setDomain(s.getDomain());
        dto.setTitle(s.getTitle());
        dto.setPublisher(s.getPublisher());
        dto.setSourceClass(s.getSourceClass());
        dto.setPublicationDate(s.getPublicationDate());
        dto.setLastUpdatedDate(s.getLastUpdatedDate());
        dto.setDateOrigin(s.getDateOrigin());
        dto.setRetrievedAt(s.getRetrievedAt());
        dto.setRetrievalMethod(s.getRetrievalMethod());
        dto.setRetrievalStatus(s.getRetrievalStatus());
        dto.setFailureReason(s.getFailureReason());
        dto.setSnippet(s.getSnippet());
        dto.setContentCharCount(s.getContentCharCount());
        return dto;
    }

    public ConflictResponse mapConflictToDto(VerificationConflict c) {
        ConflictResponse dto = new ConflictResponse();
        dto.setId(c.getId());
        dto.setClaimId(c.getClaim().getId());
        dto.setConflictType(c.getConflictType());
        dto.setDescription(c.getDescription());
        dto.setResolution(c.getResolution());
        dto.setResolutionBasis(c.getResolutionBasis());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    private String computeSha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}
