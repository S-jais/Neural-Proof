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
        Instant cutoff = Instant.now().minusSeconds(10);
        List<VerificationRun> interrupted = runRepository.findStuckRuns(cutoff);
        for (VerificationRun run : interrupted) {
            log.warn("Marking interrupted run {} as FAILED (error_code=INTERRUPTED)", run.getId());
            run.setStatus(RunStatus.FAILED);
            run.setErrorCode("INTERRUPTED");
            run.setErrorMessage("Server restart interrupted the verification pipeline. Completed claims preserved.");
            run.setCompletedAt(Instant.now());
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
        Instant cutoff = Instant.now().minusSeconds(runTimeoutSeconds);
        List<VerificationRun> stuckRuns = runRepository.findStuckRuns(cutoff);

        for (VerificationRun run : stuckRuns) {
            log.warn("Run {} exceeded total timeout limit ({}s). Ending as TIMED_OUT.", run.getId(), runTimeoutSeconds);
            run.setStatus(RunStatus.TIMED_OUT);
            run.setErrorCode("RUN_TIMEOUT");
            run.setErrorMessage("Verification exceeded the total runtime limit (" + runTimeoutSeconds + "s).");
            run.setCompletedAt(Instant.now());
            if (run.getStartedAt() != null) {
                run.setDurationMs(run.getCompletedAt().toEpochMilli() - run.getStartedAt().toEpochMilli());
            }
            runRepository.save(run);
            runService.recordEvent(run, null, "WATCHDOG", "ERROR", "Total run timeout exceeded.");
        }
    }
}
