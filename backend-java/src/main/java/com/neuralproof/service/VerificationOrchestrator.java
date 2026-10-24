package com.neuralproof.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuralproof.client.PythonPipelineClient;
import com.neuralproof.domain.*;
import com.neuralproof.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class VerificationOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(VerificationOrchestrator.class);

    private final VerificationRunRepository runRepository;
    private final ClaimRepository claimRepository;
    private final EvidenceSourceRepository sourceRepository;
    private final ClaimEvidenceRepository claimEvidenceRepository;
    private final VerificationConflictRepository conflictRepository;
    private final RetrievalOperationRepository operationRepository;
    private final VerificationRunService runService;
    private final PythonPipelineClient pythonClient;
    private final ObjectMapper objectMapper;

    @Value("${neural-proof.limits.max-claims-per-run:12}")
    private int maxClaimsPerRun;

    @Value("${neural-proof.limits.claim-concurrency:3}")
    private int claimConcurrency;

    public VerificationOrchestrator(
            VerificationRunRepository runRepository,
            ClaimRepository claimRepository,
            EvidenceSourceRepository sourceRepository,
            ClaimEvidenceRepository claimEvidenceRepository,
            VerificationConflictRepository conflictRepository,
            RetrievalOperationRepository operationRepository,
            VerificationRunService runService,
            PythonPipelineClient pythonClient,
            ObjectMapper objectMapper
    ) {
        this.runRepository = runRepository;
        this.claimRepository = claimRepository;
        this.sourceRepository = sourceRepository;
        this.claimEvidenceRepository = claimEvidenceRepository;
        this.conflictRepository = conflictRepository;
        this.operationRepository = operationRepository;
        this.runService = runService;
        this.pythonClient = pythonClient;
        this.objectMapper = objectMapper;
    }

    @Async
    public void startPipelineAsync(UUID runId, String correlationId) {
        log.info("Starting verification pipeline for run {} [cid={}]", runId, correlationId);
        Optional<VerificationRun> runOpt = runRepository.findById(runId);
        if (runOpt.isEmpty()) {
            log.error("Run {} not found to start pipeline", runId);
            return;
        }

        VerificationRun run = runOpt.get();

        try {
            // Stage 1: Answer Generation (if QUESTION mode)
            if (run.getInputType() == InputType.QUESTION) {
                run.setCurrentStage("GENERATE_ANSWER");
                runRepository.save(run);
                runService.recordEvent(run, null, "GENERATE", "INFO", "Generating provisional AI answer for question.");

                Map<String, Object> ansResult = pythonClient.generateAnswer(
                        run.getOriginalInput(),
                        run.getContextText(),
                        correlationId,
                        runId.toString()
                );

                String answer = (String) ansResult.get("answer");
                String model = (String) ansResult.get("model");
                run.setGeneratedAnswer(answer);
                run.setGenerationModel(model);
                runRepository.save(run);
                runService.recordEvent(run, null, "GENERATE", "INFO", "Provisional answer generated (" + model + ").");
            }

            // Stage 2: Claim Extraction
            run.setCurrentStage("EXTRACT_CLAIMS");
            run.setStatus(RunStatus.EXTRACTING_CLAIMS);
            runRepository.save(run);
            runService.recordEvent(run, null, "EXTRACT", "INFO", "Decomposing input into verifiable factual claims.");

            String textToExtract = run.getInputType() == InputType.QUESTION && run.getGeneratedAnswer() != null
                    ? run.getGeneratedAnswer()
                    : run.getOriginalInput();

            Map<String, Object> extractResult = pythonClient.extractClaims(
                    textToExtract,
                    run.getContextText(),
                    maxClaimsPerRun,
                    correlationId,
                    runId.toString()
            );

            List<Map<String, Object>> extractedClaims = (List<Map<String, Object>>) extractResult.get("claims");
            if (extractedClaims == null || extractedClaims.isEmpty()) {
                log.warn("No verifiable claims extracted for run {}", runId);
                runService.recordEvent(run, null, "EXTRACT", "WARN", "No verifiable claims identified in input text.");
            } else {
                persistExtractedClaims(run, extractedClaims);
                runService.recordEvent(run, null, "EXTRACT", "INFO", "Extracted " + extractedClaims.size() + " factual claims.");
            }

            // Check if claim review is requested
            if (run.isReviewBeforeVerify() && extractedClaims != null && !extractedClaims.isEmpty()) {
                run.setStatus(RunStatus.AWAITING_CLAIM_REVIEW);
                run.setCurrentStage("AWAITING_REVIEW");
                runRepository.save(run);
                runService.recordEvent(run, null, "REVIEW", "INFO", "Pipeline paused. Awaiting user claim review and selection.");
                return; // Paused until user triggers start
            }

            // Otherwise, continue straight into verification
            executeVerificationStages(run, correlationId);

        } catch (Exception e) {
            log.error("Pipeline failure for run {}: {}", runId, e.getMessage(), e);
            run.setStatus(RunStatus.FAILED);
            run.setErrorCode("PIPELINE_ERROR");
            run.setErrorMessage(e.getMessage());
            runRepository.save(run);
            runService.recordEvent(run, null, "ERROR", "ERROR", "Pipeline failed: " + e.getMessage());
        }
    }

    @Async
    public void resumeVerificationAfterReview(UUID runId, List<UUID> includedClaimIds, String correlationId) {
        log.info("Resuming verification after review for run {} [cid={}]", runId, correlationId);
        VerificationRun run = runRepository.findById(runId).orElse(null);
        if (run == null) return;

        // Apply inclusions if specified
        if (includedClaimIds != null && !includedClaimIds.isEmpty()) {
            Set<UUID> includedSet = new HashSet<>(includedClaimIds);
            List<Claim> claims = claimRepository.findByRunIdOrderByOrdinalAsc(runId);
            for (Claim c : claims) {
                boolean inc = includedSet.contains(c.getId());
                c.setIncluded(inc);
                c.setProcessingStatus(inc ? ClaimProcessingStatus.PENDING : ClaimProcessingStatus.EXCLUDED);
                claimRepository.save(c);
            }
        }

        executeVerificationStages(run, correlationId);
    }

    private void executeVerificationStages(VerificationRun run, String correlationId) {
        run.setStatus(RunStatus.VERIFYING);
        run.setCurrentStage("RESEARCH_AND_EVALUATE");
        runRepository.save(run);
        runService.recordEvent(run, null, "VERIFY", "INFO", "Starting TinyFish live research and evaluation pipeline.");

        List<Claim> claimsToVerify = claimRepository.findByRunIdOrderByOrdinalAsc(run.getId())
                .stream()
                .filter(Claim::isIncluded)
                .collect(Collectors.toList());

        // Bounded concurrency pool for claims research
        ExecutorService executor = Executors.newFixedThreadPool(claimConcurrency);
        List<Future<?>> futures = new ArrayList<>();

        for (Claim claim : claimsToVerify) {
            futures.add(executor.submit(() -> verifySingleClaim(run, claim, correlationId)));
        }

        // Wait for all claims to complete
        for (Future<?> f : futures) {
            try {
                f.get(180, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.error("Claim processing task timed out or failed: {}", e.getMessage());
            }
        }
        executor.shutdown();

        // Stage 4: Finalize and Summarize
        finalizeRun(run, correlationId);
    }

    private void verifySingleClaim(VerificationRun run, Claim claim, String correlationId) {
        log.info("Researching and evaluating claim {} ({}) [cid={}]", claim.getClaimKey(), claim.getId(), correlationId);
        try {
            claim.setProcessingStatus(ClaimProcessingStatus.SEARCHING);
            claimRepository.save(claim);
            runService.recordEvent(run, claim.getId(), "SEARCH", "INFO", "Searching TinyFish for evidence: " + claim.getClaimKey());

            Map<String, Object> claimMap = new HashMap<>();
            claimMap.put("claim_key", claim.getClaimKey());
            claimMap.put("original_text", claim.getOriginalText());
            claimMap.put("normalized_text", claim.getNormalizedText());
            claimMap.put("claim_type", claim.getClaimType());
            claimMap.put("is_time_sensitive", claim.isTimeSensitive());
            claimMap.put("verification_query", claim.getOriginalText());

            // 1. Research Claim via TinyFish
            Map<String, Object> researchBundle = pythonClient.researchClaim(
                    claimMap,
                    run.getContextText(),
                    correlationId,
                    run.getId().toString()
            );

            // Persist sources, passages, and operations
            List<Map<String, Object>> sourcesList = (List<Map<String, Object>>) researchBundle.get("sources");
            List<Map<String, Object>> passagesList = (List<Map<String, Object>>) researchBundle.get("passages");
            List<Map<String, Object>> opsList = (List<Map<String, Object>>) researchBundle.get("operations");

            persistOperations(run, claim.getId(), opsList);
            Map<String, EvidenceSource> savedSources = persistSources(run, sourcesList);
            persistEvidencePassages(claim, passagesList, savedSources);

            runService.recordEvent(run, claim.getId(), "FETCH", "INFO",
                    String.format("Retrieved %d sources and %d passages for %s.",
                            sourcesList != null ? sourcesList.size() : 0,
                            passagesList != null ? passagesList.size() : 0,
                            claim.getClaimKey()));

            // 2. Evaluate Claim
            claim.setProcessingStatus(ClaimProcessingStatus.EVALUATING);
            claimRepository.save(claim);

            Map<String, Object> evalResult = pythonClient.evaluateClaim(
                    claimMap,
                    researchBundle,
                    correlationId,
                    run.getId().toString()
            );

            // Apply evaluation findings
            applyEvaluationResult(claim, evalResult);
            persistConflicts(run, claim, (List<Map<String, Object>>) evalResult.get("conflicts"));

            runService.recordEvent(run, claim.getId(), "EVALUATE", "INFO",
                    String.format("Evaluated %s: verdict=%s, confidence=%s",
                            claim.getClaimKey(), claim.getVerdict(), claim.getConfidenceLabel()));

        } catch (Exception e) {
            log.error("Error verifying claim {}: {}", claim.getClaimKey(), e.getMessage(), e);
            claim.setProcessingStatus(ClaimProcessingStatus.EVALUATION_FAILED);
            claim.setErrorCode("EVALUATION_FAILED");
            claim.setErrorMessage(e.getMessage());
            claimRepository.save(claim);
            runService.recordEvent(run, claim.getId(), "ERROR", "ERROR",
                    "Evaluation failed for " + claim.getClaimKey() + ": " + e.getMessage());
        }
    }

    private void finalizeRun(VerificationRun run, String correlationId) {
        log.info("Finalizing verification run {} [cid={}]", run.getId(), correlationId);
        run.setCurrentStage("FINALIZING");
        runRepository.save(run);

        List<Claim> allClaims = claimRepository.findByRunIdOrderByOrdinalAsc(run.getId());
        List<Claim> included = allClaims.stream().filter(Claim::isIncluded).collect(Collectors.toList());

        long completedCount = included.stream().filter(c -> c.getProcessingStatus() == ClaimProcessingStatus.COMPLETED).count();
        long failedCount = included.stream().filter(c -> c.getProcessingStatus() == ClaimProcessingStatus.EVALUATION_FAILED
                || c.getProcessingStatus() == ClaimProcessingStatus.RETRIEVAL_FAILED).count();

        RunStatus finalStatus;
        if (completedCount == included.size() && !included.isEmpty()) {
            finalStatus = RunStatus.COMPLETED;
        } else if (completedCount > 0) {
            finalStatus = RunStatus.PARTIAL;
        } else {
            finalStatus = RunStatus.FAILED;
        }

        // Summary counts
        Map<String, Object> counts = new HashMap<>();
        counts.put("total", included.size());
        counts.put("supported", (int) included.stream().filter(c -> c.getVerdict() == Verdict.SUPPORTED).count());
        counts.put("contradicted", (int) included.stream().filter(c -> c.getVerdict() == Verdict.CONTRADICTED).count());
        counts.put("partially_supported", (int) included.stream().filter(c -> c.getVerdict() == Verdict.PARTIALLY_SUPPORTED).count());
        counts.put("insufficient_evidence", (int) included.stream().filter(c -> c.getVerdict() == Verdict.INSUFFICIENT_EVIDENCE).count());
        counts.put("not_completed", (int) failedCount);

        List<Map<String, Object>> claimSummaries = included.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("claim_key", c.getClaimKey());
            m.put("verdict", c.getVerdict() != null ? c.getVerdict().name() : "NONE");
            m.put("normalized_text", c.getNormalizedText());
            return m;
        }).collect(Collectors.toList());

        // Ask Python for summary with template fallback
        try {
            Map<String, Object> summaryResult = pythonClient.summarizeReport(
                    counts,
                    claimSummaries,
                    correlationId,
                    run.getId().toString()
            );
            run.setOverallSummary((String) summaryResult.get("summary"));
            run.setSummaryMethod((String) summaryResult.get("method"));
        } catch (Exception e) {
            log.warn("Summary generation failed; using deterministic fallback: {}", e.getMessage());
            run.setOverallSummary("Completed verification of " + included.size() + " factual claims against live web evidence.");
            run.setSummaryMethod("TEMPLATE");
        }

        run.setStatus(finalStatus);
        run.setCurrentStage("COMPLETED");
        run.setCompletedAt(Instant.now());
        if (run.getStartedAt() != null) {
            run.setDurationMs(run.getCompletedAt().toEpochMilli() - run.getStartedAt().toEpochMilli());
        }
        runRepository.save(run);

        runService.recordEvent(run, null, "FINALIZE", "INFO",
                String.format("Verification finished with status %s in %d ms.", finalStatus, run.getDurationMs()));
    }

    private void persistExtractedClaims(VerificationRun run, List<Map<String, Object>> extractedClaims) {
        int ordinal = 1;
        for (Map<String, Object> cMap : extractedClaims) {
            Claim claim = new Claim();
            claim.setRun(run);
            claim.setOrdinal(ordinal);
            claim.setClaimKey((String) cMap.getOrDefault("claim_key", "c" + ordinal));
            claim.setOriginalText((String) cMap.get("original_text"));
            claim.setNormalizedText((String) cMap.get("normalized_text"));
            claim.setSpanStart((Integer) cMap.get("span_start"));
            claim.setSpanEnd((Integer) cMap.get("span_end"));
            claim.setClaimType((String) cMap.getOrDefault("claim_type", "OTHER"));
            claim.setVerifiable((Boolean) cMap.getOrDefault("is_verifiable", true));
            claim.setNonVerifiableReason((String) cMap.get("non_verifiable_reason"));
            claim.setTimeSensitive((Boolean) cMap.getOrDefault("is_time_sensitive", false));
            claim.setIncluded(claim.isVerifiable()); // Default exclude non-verifiable
            claim.setProcessingStatus(claim.isIncluded() ? ClaimProcessingStatus.PENDING : ClaimProcessingStatus.EXCLUDED);

            claimRepository.save(claim);
            ordinal++;
        }
    }

    private Map<String, EvidenceSource> persistSources(VerificationRun run, List<Map<String, Object>> sourcesList) {
        Map<String, EvidenceSource> savedMap = new HashMap<>();
        if (sourcesList == null) return savedMap;

        for (Map<String, Object> sMap : sourcesList) {
            String url = (String) sMap.get("url");
            String normUrl = (String) sMap.getOrDefault("normalized_url", url);

            EvidenceSource source = sourceRepository.findByRunIdAndNormalizedUrl(run.getId(), normUrl)
                    .orElseGet(() -> {
                        EvidenceSource ns = new EvidenceSource();
                        ns.setRun(run);
                        ns.setUrl(url);
                        ns.setNormalizedUrl(normUrl);
                        return ns;
                    });

            source.setDomain((String) sMap.getOrDefault("domain", ""));
            source.setTitle((String) sMap.get("title"));
            source.setPublisher((String) sMap.get("publisher"));
            source.setSourceClass((String) sMap.getOrDefault("source_class", "OTHER_CREDIBLE"));
            source.setPublicationDate((String) sMap.get("publication_date"));
            source.setLastUpdatedDate((String) sMap.get("last_updated_date"));
            source.setDateOrigin((String) sMap.get("date_origin"));
            source.setRetrievalMethod((String) sMap.getOrDefault("retrieval_method", "FETCH"));
            source.setRetrievalStatus((String) sMap.getOrDefault("retrieval_status", "SUCCESS"));
            source.setFailureReason((String) sMap.get("failure_reason"));
            source.setSnippet((String) sMap.get("snippet"));
            source.setContentText((String) sMap.get("content_text"));
            source.setContentHash((String) sMap.get("content_hash"));
            if (sMap.get("content_char_count") != null) {
                source.setContentCharCount(((Number) sMap.get("content_char_count")).intValue());
            }

            source = sourceRepository.save(source);
            savedMap.put(url, source);
            savedMap.put(normUrl, source);
        }
        return savedMap;
    }

    private void persistEvidencePassages(Claim claim, List<Map<String, Object>> passagesList, Map<String, EvidenceSource> savedSources) {
        if (passagesList == null) return;

        for (Map<String, Object> pMap : passagesList) {
            String sourceUrl = (String) pMap.get("source_url");
            EvidenceSource source = savedSources.get(sourceUrl);
            if (source == null) continue;

            ClaimEvidence evidence = new ClaimEvidence();
            evidence.setClaim(claim);
            evidence.setSource(source);
            evidence.setPassageId((String) pMap.get("passage_id"));
            evidence.setPassageText((String) pMap.get("passage_text"));
            evidence.setCharStart((Integer) pMap.get("char_start"));
            evidence.setCharEnd((Integer) pMap.get("char_end"));
            if (pMap.get("relevance_score") != null) {
                evidence.setRelevanceScore(((Number) pMap.get("relevance_score")).doubleValue());
            }
            evidence.setStance(EvidenceStance.NOT_CITED);

            claimEvidenceRepository.save(evidence);
        }
    }

    private void applyEvaluationResult(Claim claim, Map<String, Object> evalResult) {
        String verdictStr = (String) evalResult.get("verdict");
        if (verdictStr != null) {
            claim.setVerdict(Verdict.valueOf(verdictStr));
        }
        claim.setExplanation((String) evalResult.get("explanation"));
        claim.setVerdictRationale((String) evalResult.get("verdict_rationale"));
        claim.setConfidenceLabel((String) evalResult.get("confidence_label"));
        claim.setConfidenceBasis((String) evalResult.get("confidence_basis"));
        claim.setEvidenceDirectness((String) evalResult.get("evidence_directness"));
        claim.setTemporalAssessment((String) evalResult.get("temporal_assessment"));
        claim.setClaimAmbiguity((String) evalResult.get("claim_ambiguity"));

        String procStatus = (String) evalResult.getOrDefault("processing_status", "COMPLETED");
        claim.setProcessingStatus(ClaimProcessingStatus.valueOf(procStatus));

        // Update cited passages stance & usedInVerdict flag
        List<Map<String, Object>> citedPassages = (List<Map<String, Object>>) evalResult.get("cited_passages");
        if (citedPassages != null) {
            Map<String, Map<String, Object>> citationMap = citedPassages.stream()
                    .collect(Collectors.toMap(c -> (String) c.get("passage_id"), c -> c, (a, b) -> a));

            List<ClaimEvidence> allEvidence = claimEvidenceRepository.findByClaimId(claim.getId());
            for (ClaimEvidence ce : allEvidence) {
                if (citationMap.containsKey(ce.getPassageId())) {
                    Map<String, Object> cit = citationMap.get(ce.getPassageId());
                    String stanceStr = (String) cit.get("stance");
                    if (stanceStr != null) {
                        ce.setStance(EvidenceStance.valueOf(stanceStr));
                    }
                    ce.setNote((String) cit.get("note"));
                    ce.setUsedInVerdict(true);
                    claimEvidenceRepository.save(ce);
                }
            }
        }

        claim.setUpdatedAt(Instant.now());
        claimRepository.save(claim);
    }

    private void persistConflicts(VerificationRun run, Claim claim, List<Map<String, Object>> conflictsList) {
        if (conflictsList == null) return;
        for (Map<String, Object> cMap : conflictsList) {
            VerificationConflict conflict = new VerificationConflict();
            conflict.setRun(run);
            conflict.setClaim(claim);
            conflict.setConflictType((String) cMap.getOrDefault("conflict_type", "FACTUAL_DISAGREEMENT"));
            conflict.setDescription((String) cMap.get("description"));
            conflict.setResolution((String) cMap.getOrDefault("resolution", "UNRESOLVED"));
            conflict.setResolutionBasis((String) cMap.get("resolution_basis"));
            conflictRepository.save(conflict);
        }
    }

    private void persistOperations(VerificationRun run, UUID claimId, List<Map<String, Object>> opsList) {
        if (opsList == null) return;
        for (Map<String, Object> opMap : opsList) {
            RetrievalOperation op = new RetrievalOperation();
            op.setRun(run);
            op.setClaimId(claimId);
            op.setProvider((String) opMap.getOrDefault("provider", "TINYFISH"));
            op.setOperation((String) opMap.getOrDefault("operation", "SEARCH"));
            op.setStatus((String) opMap.getOrDefault("status", "SUCCESS"));
            if (opMap.get("http_status") != null) {
                op.setHttpStatus(((Number) opMap.get("http_status")).intValue());
            }
            if (opMap.get("retry_count") != null) {
                op.setRetryCount(((Number) opMap.get("retry_count")).intValue());
            }
            if (opMap.get("duration_ms") != null) {
                op.setDurationMs(((Number) opMap.get("duration_ms")).doubleValue());
            }
            if (opMap.get("result_count") != null) {
                op.setResultCount(((Number) opMap.get("result_count")).intValue());
            }
            if (opMap.get("cache_hit") != null) {
                op.setCacheHit((Boolean) opMap.get("cache_hit"));
            }
            operationRepository.save(op);
        }
    }
}
