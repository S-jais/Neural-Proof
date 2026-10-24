package com.neuralproof.service;

import com.neuralproof.domain.RunStatus;
import com.neuralproof.domain.VerificationRun;
import com.neuralproof.repository.VerificationRunRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class WatchdogService {

    private static final Logger log = LoggerFactory.getLogger(WatchdogService.class);

    private final VerificationRunRepository runRepository;
    private final VerificationRunService runService;

    @Value("${neural-proof.limits.run-total-timeout-seconds:480}")
    private int runTimeoutSeconds;

    private final java.util.concurrent.ConcurrentMap<java.util.UUID, Instant> jobStartTimes = new java.util.concurrent.ConcurrentHashMap<>();

    public WatchdogService(VerificationRunRepository runRepository, VerificationRunService runService) {
        this.runRepository = runRepository;
        this.runService = runService;
    }

    /**
     * On application startup: Recover runs left in non-terminal states by previous server process.
     */
    @PostConstruct
    @Transactional
    public void recoverInterruptedRuns() {
        log.info("Watchdog: Checking for interrupted verification runs from previous execution...");
        Instant now = Instant.now();
        List<VerificationRun> active = runRepository.findActiveRuns();
        for (VerificationRun run : active) {
            log.warn("Marking interrupted run {} as FAILED (error_code=INTERRUPTED)", run.getId());
            run.setStatus(RunStatus.FAILED);
            run.setErrorCode("INTERRUPTED");
            run.setErrorMessage("Server restart interrupted the verification pipeline. Completed claims preserved.");
            run.setCompletedAt(now);
            runRepository.save(run);
            runService.recordEvent(run, null, "WATCHDOG", "WARN", "Run marked FAILED due to process restart.");
        }
    }

    /**
     * Periodic watchdog: enforce total timeout on running jobs (default 8 minutes).
     */
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    @Transactional
    public void checkTimeouts() {
        Instant now = Instant.now();
        List<VerificationRun> activeRuns = runRepository.findActiveRuns();

        for (VerificationRun run : activeRuns) {
            Instant start = jobStartTimes.computeIfAbsent(run.getId(), k -> now);
            long elapsedSeconds = java.time.Duration.between(start, now).getSeconds();
            if (elapsedSeconds > runTimeoutSeconds) {
                log.warn("Run {} exceeded total timeout limit ({}s). Ending as TIMED_OUT.", run.getId(), runTimeoutSeconds);
                run.setStatus(RunStatus.TIMED_OUT);
                run.setErrorCode("RUN_TIMEOUT");
                run.setErrorMessage("Verification exceeded the total runtime limit (" + runTimeoutSeconds + "s).");
                run.setCompletedAt(now);
                if (run.getStartedAt() != null) {
                    run.setDurationMs(run.getCompletedAt().toEpochMilli() - run.getStartedAt().toEpochMilli());
                }
                runRepository.save(run);
                runService.recordEvent(run, null, "WATCHDOG", "ERROR", "Total run timeout exceeded.");
                jobStartTimes.remove(run.getId());
            }
        }
    }
}
