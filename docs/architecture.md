# Neural Proof: Architecture Document

## Mission
Neural Proof independently verifies factual claims in AI-generated answers. It decomposes an answer into individual claims, retrieves real evidence from the live web through TinyFish, compares each claim with retrieved passages, detects contradictions between sources, and produces a transparent, traceable verification report.

**Core Principle:** Every factual claim should be inspectable, every verdict should have a reason, every source should be traceable, and uncertainty should never be disguised as certainty.

## Architecture Overview

```
Browser (React + TS + Tailwind, :5173)
   |  HTTPS/JSON, anonymous session cookie
   v
Java Spring Boot (public API + orchestrator, :8080)  <---->  PostgreSQL (:5432)
   |  internal REST/JSON, X-Internal-Token, X-Correlation-Id
   v
Python FastAPI (AI + evidence pipeline, :8000, internal only)
   |-> LLM provider (behind an abstraction)
   |-> TinyFish Search / Fetch / (Agent)
```

## Service Responsibilities

| Component | Owns | Must NOT do |
|-----------|------|-------------|
| **React frontend** | All UI, polling for job status, client-side filtering/search, JSON export, print-to-PDF report view | Hold any secret; call FastAPI or TinyFish directly |
| **Spring Boot** | Public API; request validation; anonymous session and ownership; job lifecycle and orchestration; progress events; persistence (Flyway/JPA); rate limiting; standardized errors; timeouts; stuck-job recovery; deterministic report aggregation | Re-implement extraction, retrieval, or evaluation logic |
| **FastAPI** | Question answering, claim extraction, query generation, TinyFish integration, source ranking, passage extraction, deduplication, conflict detection, claim evaluation, summary text, structured schemas, health checks | Expose TinyFish or LLM keys; persist business data; accept calls without internal token |
| **TinyFish** | Live search and page retrieval (and bounded agent navigation) | Be mocked in the live path |
| **LLM** | Structured extraction, query writing, evaluation reasoning, constrained summary text | Decide truth from its own knowledge; supply sources, dates or quotes |
| **PostgreSQL** | Runs, claims, sources, evidence passages, conflicts, events, retrieval operations | Store secrets |

## Orchestration Model (Stage-Based)

Java orchestrates, Python executes stages:

1. **POST /api/v1/verifications** → creates run (QUEUED), returns ID immediately
2. **Stage 1: Generate** (question mode only) → Java calls FastAPI to generate answer
3. **Stage 2: Extract** → Java calls FastAPI to extract claims, persists them
4. **Stage 3: Research + Evaluate** (per claim, bounded parallelism = 3) → query generation → TinyFish Search → rank → TinyFish Fetch → passage extraction → evaluation → persist
5. **Stage 4: Finalize** → Java computes counts, asks FastAPI for summary, sets final status

## Data Flow

```
User input → validation (Java) → [question mode: answer generation] 
→ claim extraction (Python/LLM, schema-validated) → optional user review 
→ per claim: query generation → TinyFish Search → dedupe and rank 
→ TinyFish Fetch of top candidates → passage extraction 
→ LLM evaluation over stored passages by ID → deterministic guardrails 
→ conflict analysis → persist → aggregate → report
```

## Engineering Decisions

| Decision | Rationale |
|----------|-----------|
| **No Docker requirement for dev** | Docker not installed on the dev machine; use local services with documented manual setup |
| **Maven for Java** | Standard, wrapper-based, well-supported for Spring Boot |
| **Python 3.11** | Available on system, LTS compatible |
| **Java 25 LTS** | Available on system |
| **Node v25** | Available on system, for React frontend |
| **TinyFish Python SDK (`pip install tinyfish`)** | Official SDK exists and is maintained; prefer over raw httpx |
| **httpx as fallback** | If SDK doesn't cover our needs, use httpx against documented REST API |
| **Anonymous sessions** | No authentication for MVP; cookie-based session separation |
| **No Kafka/Redis/K8s** | Plain @Async / ThreadPoolTaskExecutor for bounded concurrency |
| **Flyway for migrations** | Java owns the schema; Python never touches business tables |
| **PostgreSQL via local install or Docker** | Flexible; provide both options |

## TinyFish Verified Contract Summary

| Capability | Endpoint | Method | Auth Header | Status |
|-----------|----------|--------|-------------|--------|
| Search | `GET https://api.search.tinyfish.ai` | GET | `X-API-Key` | VERIFIED from docs |
| Fetch | `POST https://api.fetch.tinyfish.ai` | POST | `X-API-Key` | VERIFIED from docs |
| Agent | `POST https://agent.tinyfish.ai/v1/automation/run-sse` | POST (SSE) | `X-API-Key` | VERIFIED from docs |
| Browser | Not used | N/A | N/A | Decision: NOT NEEDED |

See `docs/tinyfish-integration.md` for the full verified contract.

## Environment Variables

See `.env.example` for the complete list with descriptions.

## Toolchain Detected

- Node.js: v25.8.2
- npm: 11.12.1
- Python: 3.11.9
- Java: 25.0.2 LTS
- Docker: NOT INSTALLED
- Maven: NOT INSTALLED (will use wrapper)
- Gradle: NOT INSTALLED (will use Maven wrapper)
