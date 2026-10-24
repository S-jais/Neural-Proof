# Neural Proof: Deployment and Hardening Guide

This document describes production deployment procedures, environment hardening, and security configurations for Neural Proof.

## 1. Network Topology and Service Ports

| Service | Internal Port | Public Host Port | Protocol | Notes |
|---------|---------------|------------------|----------|-------|
| **React Frontend** | 5173 | 5173 | HTTP/HTTPS | Served via Nginx in production container |
| **Java Spring Boot** | 8080 | 8080 | HTTP/HTTPS | Public API & Orchestrator |
| **PostgreSQL** | 5432 | 5432 (dev only) | TCP | Named volume `postgres_data` |
| **Python FastAPI** | 8000 | NONE (internal) | HTTP | Isolated to `neural-network`; requires `X-Internal-Token` |

> [!IMPORTANT]
> In production Docker Compose, port 8000 for Python FastAPI is **exposed only to internal services**, not published to the host. All public interactions must pass through Spring Boot at `:8080`.

---

## 2. Environment Variables & Secrets Management

All secrets must be supplied via server-side environment variables or a git-ignored `.env` file. Never commit real keys to version control.

```env
# Secrets (Mandatory for live operation)
TINYFISH_API_KEY=your_actual_tinyfish_api_key_here
LLM_API_KEY=your_actual_openai_or_anthropic_key_here
INTERNAL_SERVICE_TOKEN=generate-a-strong-random-hex-string

# Database
DATABASE_URL=jdbc:postgresql://postgres:5432/neural_proof
DATABASE_USERNAME=neural
DATABASE_PASSWORD=proof_secret

# AI Settings
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
TINYFISH_AGENT_ENABLED=false
TINYFISH_MOCK=false
APP_ENV=production

# URLs
PYTHON_BACKEND_URL=http://backend-python:8000
FRONTEND_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 3. Production Hardening Checklist

1. **Prompt Injection Quarantine**: Evidence text retrieved from third-party sites is treated as untrusted data. Rendered strictly as escaped text in React (no `dangerouslySetInnerHTML`). System prompts explicitly instruct the LLM evaluator to ignore instructions contained in quoted evidence passages.
2. **SSRF Defense**: The Fetch service validates target URLs against local loopback (`127.0.0.1`), private RFC1918 subnets, and cloud metadata endpoints (`169.254.169.254`). Arbitrary user-supplied URLs cannot be fetched directly.
3. **Constant-Time Token Comparison**: Spring Boot to FastAPI communication uses `hmac.compare_digest` to prevent side-channel timing attacks on `X-Internal-Token`.
4. **Anonymous Session Isolation**: Database rows filter by `owner_session_id` stored in an `HttpOnly`, `SameSite=Lax` cookie. Users cannot access, modify, or delete another browser session's verification records.
5. **Watchdog Timeout Recovery**: Background task recovers stuck or interrupted jobs on restart, marking them `INTERRUPTED` without losing completed claims.
