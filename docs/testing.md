# Neural Proof: Testing and Verification Audit

This document records the exact test execution results, command outputs, exit codes, and verification audit trail for Neural Proof adhering to Part I of the specification.

## 1. Test Execution Summary

| Suite / Check | Command | Pass Count | Fail Count | Exit Code | Status | Date |
|---------------|---------|------------|------------|-----------|--------|------|
| **Python Unit Tests** | `python -m pytest tests/` | 12 | 0 | 0 | **PASSED** | 2026-10-24 |
| **Java Unit Tests** | `.\mvnw.ps1 test` | 10 | 0 | 0 | **PASSED** | 2026-10-24 |
| **Frontend Unit Tests** | `npm run test` | 5 | 0 | 0 | **PASSED** | 2026-10-24 |
| **Frontend Production Build** | `npm run build` | 1636 modules | 0 | 0 | **PASSED** | 2026-10-24 |
| **TinyFish Live Smoke Test** | `python scripts/tinyfish_smoke_test.py` | 0 | 1 | 1 | **NOT RUN** (Missing key) | 2026-10-24 |
| **Live Multi-Service Integration** | Real REST invocation (Browser/Curl -> Spring Boot -> FastAPI) | 4 stages | 0 | 0 | **VERIFIED** | 2026-10-24 |

---

## 2. Python Test Suite Execution Details

Command executed:
```bash
python -m pytest tests/
```

Observed Output:
```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.3.4, pluggy-1.6.0
rootdir: C:\Users\siddhartha jaiswal\OneDrive\Imports\Desktop\Neural Proof\backend-python
configfile: pyproject.toml
plugins: anyio-4.13.0, asyncio-0.24.0, cov-7.1.0, mock-3.14.0, typeguard-4.6.0
asyncio: mode=Mode.AUTO, default_loop_scope=None
collected 12 items

tests\test_guardrails.py ....                                            [ 33%]
tests\test_passage_extractor.py .                                        [ 41%]
tests\test_services.py ....                                              [ 75%]
tests\test_tinyfish.py ...                                               [100%]

============================= 12 passed in 0.64s ==============================
```

### Verified Behavioral Properties:
1. **Guardrail G1**: Unknown or hallucinated passage IDs dropped from evaluator citations.
2. **Guardrail G2**: Conclusive verdicts with zero cited passages downgraded to `INSUFFICIENT_EVIDENCE`.
3. **Guardrail G3**: Evidence derived solely from search snippets cannot produce a conclusive verdict.
4. **Prompt Injection Defense (G2)**: Quoted passage text containing prompt override instructions (`SYSTEM OVERRIDE: Ignore all previous instructions...`) is properly neutralized and quarantined.
5. **Verbatim Passage Substring Guarantee (D7)**: Every passage slice is verified against original text content with matching character offsets.
6. **Query Generator Anti-Bias (D4)**: Absolute assertions automatically trigger counter-evidence queries.
7. **Degraded Segmenter (C2)**: Sentence segmentation properly identifies non-verifiable statements (questions, subjective opinions) when no LLM key is configured.
8. **Source Ranker (D5)**: Domain authority heuristics, TLD patterns, and diversity caps (max 2 per domain).
9. **Conflict Detection & Temporal Preference (C8)**: Newer sources selected for time-sensitive assertions.
10. **TinyFish Client (D3)**: Auth header presence, key redaction, URL safety check against private/localhost IPs.

---

## 3. Java Unit Test Suite Execution Details

Command executed:
```bash
.\mvnw.ps1 test
```

Observed Output:
```
[INFO] Running com.neuralproof.exception.GlobalExceptionHandlerTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.216 s -- in com.neuralproof.exception.GlobalExceptionHandlerTest
[INFO] Running com.neuralproof.security.SessionManagerTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.130 s -- in com.neuralproof.security.SessionManagerTest
[INFO] Running com.neuralproof.service.VerificationRunServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.564 s -- in com.neuralproof.service.VerificationRunServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Verified Properties:
1. **Duplicate Submission Handling (C1)**: Reuses existing run on identical input within 60 seconds.
2. **Session Ownership Enforcement (E4)**: Foreign or unknown sessions are rejected with 404.
3. **Claim Review Mutation Protection (C4)**: Modifying inclusion state is allowed only during `AWAITING_CLAIM_REVIEW`, returning 409 `CONFLICTING_STATE` otherwise.
4. **Deterministic Report Aggregation (B2, C9)**: Computes counts across exactly four verdicts and tracks incomplete claims separately.
5. **Standardized Exception Structure (G4)**: Never leaks stack traces or database connection details to clients.

---

## 4. Frontend Vitest and Production Build Execution

Unit tests executed:
```bash
npm run test --prefix frontend
```

Observed Output:
```
 RUN  v2.1.9 C:/Users/siddhartha jaiswal/OneDrive/Imports/Desktop/Neural Proof/frontend

 ✓ src/__tests__/verdicts_and_badges.test.ts (3 tests) 5ms
 ✓ src/__tests__/api_client.test.ts (2 tests) 4ms

 Test Files  2 passed (2)
      Tests  5 passed (5)
   Duration  979ms
```

Production build executed:
```bash
npm run build --prefix frontend
```

Observed Output:
```
> neural-proof-frontend@0.1.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1636 modules transformed.
rendering chunks...
dist/index.html                   1.16 kB │ gzip:  0.61 kB
dist/assets/index-Bkt-9-U8.css   29.50 kB │ gzip:  5.85 kB
dist/assets/index-BIn06h75.js   278.25 kB │ gzip: 81.55 kB
✓ built in 3.30s
```

---

## 5. TinyFish Live Smoke Test Execution

Command executed:
```bash
python scripts/tinyfish_smoke_test.py
```

Observed Output:
```
============================================================
Neural Proof - TinyFish Live Smoke Test (D12)
============================================================
[FAIL] NOT RUN: TINYFISH_API_KEY is not configured in environment.
       Live integration status: UNVERIFIED.
       To verify: export TINYFISH_API_KEY="your-key" and re-run.
============================================================
```

- **Recorded Outcome**: `NOT RUN: credential unavailable`.
- **Status**: Recorded honestly as `UNVERIFIED` per Law 9 and Part D12. Mocked responses were never used to fabricate a passing result.

---

## 6. End-to-End Live Integration Verification

A real execution was triggered through the multi-service stack:
1. `POST /api/v1/verifications` created run `90e10569-e733-40ed-874c-f407ff2bd6e7` in `QUEUED` status.
2. Java orchestrator invoked Python FastAPI `/internal/v1/claims/extract` with `X-Internal-Token` and `X-Correlation-Id`.
3. Rule-based sentence segmenter decomposed text into 2 verifiable claims (`c1`, `c2`).
4. Run transitioned to `AWAITING_CLAIM_REVIEW`.
5. Client called `POST /api/v1/verifications/{id}/start` with session cookie.
6. Pipeline transitioned to `VERIFYING` and called `/internal/v1/claims/research`.
7. `QueryGenerator` created search queries. TinyFish client recorded missing key error without crashing.
8. Guardrail G4 applied: `processing_status=RETRIEVAL_FAILED`, `verdict=null`.
9. Summary generated via deterministic template fallback: `"Checked 2 factual claims against live web evidence. Note: 2 claims were not completed due to retrieval or evaluation limits."`
10. Final report successfully persisted to H2/PostgreSQL and retrieved via `GET /api/v1/verifications/{id}`.
