# TinyFish Integration Documentation

## Verified Contract Table

All information below was verified against the official TinyFish documentation on 2026-10-24.

### Search API

| Field | Value |
|-------|-------|
| **Endpoint URL** | `GET https://api.search.tinyfish.ai` |
| **HTTP Method** | GET |
| **Authentication** | `X-API-Key` header (case-sensitive) |
| **Request Parameters** | `query` (required), `purpose`, `location`, `language`, `include_domains`, `exclude_domains`, `recency_minutes`, `after_date`, `before_date`, `domain_type` (web/news/research_paper), `page` |
| **Response Fields** | `query`, `results[]`, `total_results`, `page` |
| **Result Fields** | `position`, `site_name`, `title`, `snippet`, `url`, `date` (optional), `publisher` (news only) |
| **Sync/Async** | Synchronous |
| **Rate Limit** | 30 requests/minute per API key |
| **Free Allowance** | 12,000 requests/day (resets 00:00 UTC) |
| **Error Codes** | 400, 401, 402, 403, 404, 429, 500, 503 |
| **SDK** | `from tinyfish import TinyFish; client.search.query(query=...)` |
| **Date Verified** | 2026-10-24 |
| **Documentation URL** | https://docs.tinyfish.ai/search-api/reference.md |

### Fetch API

| Field | Value |
|-------|-------|
| **Endpoint URL** | `POST https://api.fetch.tinyfish.ai` |
| **HTTP Method** | POST |
| **Authentication** | `X-API-Key` header (case-sensitive) |
| **Request Parameters** | `urls[]` (required, max 10), `format` (markdown/html/json, default: markdown), `links`, `image_links`, `ttl`, `per_url_timeout_ms` |
| **Response Fields** | `results[]`, `errors[]` |
| **Result Fields** | `url`, `final_url`, `title`, `description`, `language`, `author`, `published_date`, `text`, `latency_ms`, `format` |
| **Error Fields** | `url`, `error` (code), `status` (optional HTTP code) |
| **Per-URL Error Codes** | `target_http_error`, `page_not_found`, `target_unreachable`, `timeout`, `bot_blocked`, `empty_content`, `login_required`, `content_too_large`, `invalid_url`, `invalid_redirect_url`, `proxy_error` |
| **Sync/Async** | Synchronous |
| **Rate Limit** | 150 URLs/minute per API key |
| **Free Allowance** | 1,000 URLs/day (resets 00:00 UTC) |
| **Error Codes (HTTP)** | 400, 401, 402, 429, 500, 503 |
| **Timeout** | 110s per URL backend, 120s CDN ceiling; set client timeout to ≥150s |
| **URL Safety** | Rejects private IPs, localhost, cloud metadata endpoints |
| **SDK** | `from tinyfish import TinyFish; client.fetch.get_contents(urls=[...])` |
| **Date Verified** | 2026-10-24 |
| **Documentation URL** | https://docs.tinyfish.ai/fetch-api/reference.md |

### Agent API

| Field | Value |
|-------|-------|
| **Endpoint URL (SSE)** | `POST https://agent.tinyfish.ai/v1/automation/run-sse` |
| **Endpoint URL (sync)** | `POST https://agent.tinyfish.ai/v1/automation/run` |
| **Endpoint URL (async)** | `POST https://agent.tinyfish.ai/v1/automation/run-async` |
| **HTTP Method** | POST |
| **Authentication** | `X-API-Key` header |
| **Request Parameters** | `url`, `goal`, `output_schema` (optional) |
| **Sync/Async** | Sync, Async, or SSE streaming |
| **Pricing** | Metered (not free) |
| **SDK** | `from tinyfish import TinyFish; client.agent.run(url=..., goal=...)` |
| **Date Verified** | 2026-10-24 |
| **Documentation URL** | https://docs.tinyfish.ai/agent-api/reference.md |

### Browser API

| Field | Value |
|-------|-------|
| **Decision** | NOT IMPLEMENTED |
| **Reason** | Search, Fetch, and Agent capabilities cover all Neural Proof needs. Browser would add complexity and cost without benefit for the evidence-checking use case. |
| **Date Decided** | 2026-10-24 |

## Python SDK

| Field | Value |
|-------|-------|
| **Package** | `pip install tinyfish` |
| **Import** | `from tinyfish import TinyFish` |
| **Auth** | Reads `TINYFISH_API_KEY` from environment automatically |
| **Search** | `client.search.query(query="...")` |
| **Fetch** | `client.fetch.get_contents(urls=["..."], format="markdown")` |
| **Agent** | `client.agent.run(url="...", goal="...")` |

## Usage Rules for Neural Proof

1. All TinyFish calls go through `integrations/tinyfish/client.py`
2. API key read only from `TINYFISH_API_KEY` environment variable
3. Never log, echo, or return the key
4. Explicit connect and read timeouts per operation type
5. Retries with exponential backoff for: timeouts, connection errors, HTTP 429, 5xx
6. Maximum 3 retry attempts
7. Never retry 400, 401, 403, 404
8. Global concurrency limit: asyncio semaphore (default 4)
9. Per-run request budget enforcement

## Smoke Test

| Field | Value |
|-------|-------|
| **Script** | `backend-python/scripts/tinyfish_smoke_test.py` |
| **Status** | NOT RUN: credential unavailable |
| **Date** | 2026-10-24 |
| **Integration Status** | UNVERIFIED (Awaiting user TINYFISH_API_KEY in .env) |
| **Command** | `python scripts/tinyfish_smoke_test.py` |
| **Observed Output** | `[FAIL] NOT RUN: TINYFISH_API_KEY is not configured in environment.` (exit code 1) |
| **Notes** | Script created and validated with unit tests; live execution pending user-supplied API key. |

