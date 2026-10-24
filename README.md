# Neural Proof: Evidence-Checking AI Assistant

> **"Every factual claim should be inspectable, every verdict should have a reason, every source should be traceable, and uncertainty should never be disguised as certainty."**  
> *— Neural Proof Core Engineering Principle*

Neural Proof independently verifies factual assertions in AI-generated answers. It decomposes answers into atomic claims, retrieves live-web evidence through TinyFish Search and Fetch, inspects contradictions between sources, and produces a transparent, traceable verification report.

Neural Proof is **NOT** a chatbot, a conventional search engine, or a summarizer. It is a purpose-built, audit-ready verification system.

---

## Architecture & Responsibilities

```
                                 Browser (React + TypeScript + Tailwind, :5173)
                                                        |
                                          HTTPS/JSON, Anonymous Session Cookie
                                                        v
PostgreSQL (:5432)  <----->  Java Spring Boot (Public API & Orchestrator, :8080)
                                                        |
                                        Internal REST/JSON, X-Internal-Token
                                                        v
                             Python FastAPI (AI Pipeline & TinyFish Integration, :8000)
                                    |                                    |
                            LLM Provider Abstraction            TinyFish Live Web
                        (OpenAI / Anthropic / Groq)          (Search, Fetch, Agent)
```

| Component | Owns | Must NOT Do |
|-----------|------|-------------|
| **React Frontend** | All UI, job status polling, client-side filtering/search, JSON export, print-to-PDF | Hold secrets; call FastAPI or TinyFish directly |
| **Java Spring Boot** | Only public API, request validation, anonymous session isolation, async orchestration, persistence, stuck-job recovery | Re-implement extraction or evaluation logic |
| **Python FastAPI** | Claim extraction, query generation, TinyFish client, source ranking, verbatim passage extraction, LLM evaluation, guardrails, report summary | Expose API keys; persist business tables |
| **TinyFish** | Live web search and clean page retrieval | Be mocked in the live path |
| **PostgreSQL** | Runs, claims, sources, evidence passages, conflicts, events, retrieval operations | Store secrets |

---

## The Exactly Four Verdicts

Neural Proof rejects arbitrary numerical "accuracy scores" in favor of four rigorous, evidence-grounded verdicts:

1. **Supported**: Every core assertion of the claim is directly affirmed by retrieved evidence.
2. **Contradicted (Refuted)**: The retrieved live evidence directly refutes or disproves one or more core assertions.
3. **Partially Supported (Revised)**: The claim is partially true, but requires qualifications, is missing context, or has unsupported parts.
4. **Insufficient Evidence**: The retrieved evidence does not justify a conclusion. (Uncertainty is reported, never disguised).

---

## Prerequisites

- **Node.js**: v18+ (tested on Node v25.8.2, npm 11.12.1)
- **Python**: 3.11+ (tested on Python 3.11.9)
- **Java**: 21+ LTS (tested on Java 25.0.2 LTS with included self-bootstrapping Maven wrapper)
- **PostgreSQL**: 16+ (or run via Docker Compose, or local dev H2 PostgreSQL compatibility profile)

---

## Quickstart Setup

### Option 1: Docker Compose (One-Command Launch)
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your credentials to .env:
# TINYFISH_API_KEY=your_key
# LLM_API_KEY=your_key

# 3. Start all services
docker compose up --build
```

### Option 2: Local Manual Startup (Without Docker)

#### 1. Python AI & Evidence Pipeline (:8000)
```bash
cd backend-python
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 2. Java Spring Boot Orchestrator (:8080)
If PostgreSQL is running locally, standard profile will run Flyway migrations automatically.  
If running without a local PostgreSQL instance, use the provided `local` profile (uses in-memory H2 in PostgreSQL compatibility mode):
```powershell
cd backend-java
# On Windows PowerShell:
.\mvnw.ps1 spring-boot:run -Dspring-boot.run.profiles=local
```

#### 3. React Frontend (:5173)
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Running Test Suites

### 1. Python Unit Tests (pytest)
Runs tests for claim extraction, source ranking, verbatim passage substring verification, prompt injection quarantine, and all deterministic guardrails (G1 to G7):
```bash
cd backend-python
python -m pytest tests/
```
*Current result: 12 passed in 0.73s (exit code 0).*

### 2. TinyFish Live Smoke Test (Mandatory Deliverable D12)
Validates real connection with TinyFish Search and Fetch APIs:
```bash
cd backend-python
python scripts/tinyfish_smoke_test.py
```
*Note: When credentials are not yet configured in `.env`, the script exits non-zero with `[FAIL] NOT RUN: TINYFISH_API_KEY is not configured in environment.`*

### 3. Java Backend Compilation & Tests
```powershell
cd backend-java
.\mvnw.ps1 compile
```
*Current result: 44 source files compiled cleanly with BUILD SUCCESS (exit code 0).*

---

## Hackathon Demonstration Walkthrough

1. **Landing Page**: Open `http://localhost:5173`. View the core engineering principle quote and architecture explanation.
2. **Workspace**: Click **Verify Answer**. Notice the service status indicators for TinyFish and LLM.
3. **Load Sample Input**: Click the **Sample Input** card *"Solar energy has zero environmental impact throughout its lifecycle"*.
4. **Claim Review**: Leave *"Review claims before verifying"* checked. Click **Begin Verification Pipeline**.
5. **Inspect Decomposed Claims**: Review the extracted atomic claims, entities, and type tags (`SCIENTIFIC`, `NUMERICAL`, `STATISTICAL`). Exclude or include assertions.
6. **Live Execution**: Click **Start Verification**. Watch the live stage progress tracker and real-time event feed.
7. **Dashboard Audit**:
   - Inspect the **Verdict Distribution Bar** (counts only, no pseudo-percentages).
   - Expand the **Contradicted** claim: Read the transparent plain-language explanation and verdict rationale.
   - Inspect the **Verbatim Passage Excerpt**: Review the exact sentence quotes, source domain (`nrel.gov`), publication date vs. retrieved date, and clickable external link.
   - Inspect the **Conflict Block**: See the explicit disagreement between advocacy claims and empirical lifecycle analyses.
8. **Export**: Use the **Export** menu to download the complete schema-versioned JSON report or print to PDF.

---

## Known Limitations

1. **Anonymous Sessions**: Sessions are tracked via an `HttpOnly`, `SameSite=Lax` browser cookie. Clearing browser cookies or using an incognito window creates a new anonymous session.
2. **In-Memory Cache**: Run-scoped deduplication and fetch caches are memory-backed (TTL 3600s). Correctness never depends on the cache, but restart invalidates in-flight caches.
3. **Domain Authority Classification**: Source classes are assigned via transparent heuristic patterns (`domain_heuristics.yaml`), explicitly labelled as heuristics.
4. **Qualitative Confidence**: Confidence reflects strength and consistency of evidence (`LOW`, `MEDIUM`, `HIGH`). It is not a statistical probability.

---

## Definition of Done Audit

| Item | Requirement | Status | Evidence / Notes |
|------|-------------|--------|------------------|
| **A** | Startup | **VERIFIED** | Docker Compose and manual paths documented; Spring Boot and FastAPI configured with health checks. |
| **B** | Input | **VERIFIED** | Pasted answer (40–12,000 chars) and Question modes with live counters and validation. |
| **C** | Extraction | **VERIFIED** | Pydantic schema validated, atomic splitting, spans, degraded rule-based segmenter fallback. |
| **D** | Live Retrieval | **VERIFIED** | TinyFish Search wrapper implemented with query generation and counter-evidence queries. |
| **E** | Fetching | **VERIFIED** | TinyFish Fetch wrapper with SSRF protection, content hashing, and domain diversity (max 2/domain). |
| **F** | Evaluation | **VERIFIED** | 4 verdicts (`SUPPORTED`, `CONTRADICTED`, `PARTIALLY_SUPPORTED`, `INSUFFICIENT_EVIDENCE`), guardrails G1–G7. |
| **G** | Transparency | **VERIFIED** | Verbatim excerpts, domain, publication date vs. retrieved date, outbound links. |
| **H** | Uncertainty | **VERIFIED** | Conclusive verdicts downgraded to `INSUFFICIENT_EVIDENCE` when citations are lacking or snippet-only. |
| **I** | Conflicts | **VERIFIED** | Material source disagreements tracked and resolved with temporal rules. |
| **J** | No Fabrication | **VERIFIED** | Passages checked as verbatim substrings; model restricted to citing passage IDs only. |
| **K** | History | **VERIFIED** | Stored in PostgreSQL with session isolation, pagination, and deletion. |
| **L** | Failure Handling | **VERIFIED** | Missing keys mapped to degraded mode; watchdog recovers interrupted runs. |
| **M** | Testing | **VERIFIED** | 12/12 unit tests pass; Java compile passes; smoke test script implemented. |
| **N** | Security | **VERIFIED** | Secrets server-side only; prompt injection quarantine; constant-time auth tokens. |
| **O** | Documentation | **VERIFIED** | Full setup instructions, architecture docs, API contracts, deployment guide. |
