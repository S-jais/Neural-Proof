"""
TinyFish Client — Transport, Auth, Timeouts, Retries, Rate-limit Handling.

All TinyFish HTTP calls go through this client.
The client:
- Reads API key only from TINYFISH_API_KEY env var
- Never logs, echoes, or returns the key
- Provides explicit connect and read timeouts per operation type
- Retries with exponential backoff and jitter for transient failures
- Enforces a global concurrency limit (asyncio semaphore)
- Tracks per-run request budgets
- Records operation metadata for observability
"""

import asyncio
import hashlib
import hmac
import logging
import random
import re
import time
from typing import Optional

import httpx

from app.core.config import settings
from app.integrations.tinyfish.models import (
    OperationRecord,
    OperationStatus,
    TinyFishStatus,
    TinyFishError,
    TinyFishNotConfigured,
    TinyFishAuthError,
    TinyFishRateLimited,
    TinyFishTimeout,
    TinyFishUnavailable,
    TinyFishBadResponse,
    TinyFishBudgetExceeded,
)

logger = logging.getLogger("neural_proof.tinyfish")

# Key redaction filter
_KEY_PATTERN = re.compile(r"(X-API-Key|api[_-]?key|token)[=:\s]+\S+", re.IGNORECASE)


def _redact(text: str) -> str:
    """Redact API keys and sensitive header values from text."""
    return _KEY_PATTERN.sub(r"\1=[REDACTED]", text)


class TinyFishClient:
    """
    Central client for all TinyFish API calls.
    Thread-safe, with bounded concurrency and per-run budget tracking.
    """

    # Endpoints from verified documentation
    SEARCH_URL = "https://api.search.tinyfish.ai"
    FETCH_URL = "https://api.fetch.tinyfish.ai"
    AGENT_URL = "https://agent.tinyfish.ai/v1/automation/run"

    MAX_RETRIES = 3
    RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
    NON_RETRYABLE_STATUS_CODES = {400, 401, 403, 404}

    def __init__(self):
        if not settings.tinyfish_configured:
            self._status = TinyFishStatus.NOT_CONFIGURED
            self._api_key = None
        else:
            self._status = TinyFishStatus.OK
            self._api_key = settings.tinyfish_api_key

        self._semaphore = asyncio.Semaphore(settings.tinyfish_max_concurrency)
        self._auth_failed = False

        # Per-run budget tracking: {verification_id: {search: n, fetch: n, agent: n}}
        self._run_budgets: dict[str, dict[str, int]] = {}

    @property
    def status(self) -> TinyFishStatus:
        if self._auth_failed:
            return TinyFishStatus.AUTH_FAILED
        return self._status

    def _check_configured(self):
        """Raise if not configured."""
        if not self._api_key:
            raise TinyFishNotConfigured(
                "TINYFISH_API_KEY is not configured. "
                "Set it in the .env file or environment."
            )
        if self._auth_failed:
            raise TinyFishAuthError(
                "TinyFish authentication has failed. Check your API key."
            )

    def _get_headers(self) -> dict[str, str]:
        """Build request headers with auth. Never log these."""
        return {
            "X-API-Key": self._api_key,
            "Content-Type": "application/json",
        }

    def _get_timeout(self, operation: str) -> httpx.Timeout:
        """Get timeout config for the operation type."""
        connect = settings.tinyfish_connect_timeout
        if operation == "search":
            read = settings.tinyfish_search_timeout
        elif operation == "fetch":
            read = settings.tinyfish_fetch_timeout
        elif operation == "agent":
            read = settings.tinyfish_agent_timeout
        else:
            read = 30
        return httpx.Timeout(connect=connect, read=read, write=connect, pool=connect)

    def init_run_budget(self, verification_id: str):
        """Initialize budget tracking for a verification run."""
        self._run_budgets[verification_id] = {
            "search": 0,
            "fetch": 0,
            "agent": 0,
            "total_requests": 0,
        }

    def cleanup_run_budget(self, verification_id: str):
        """Remove budget tracking for a completed run."""
        self._run_budgets.pop(verification_id, None)

    def get_run_summary(self, verification_id: str) -> dict:
        """Get retrieval summary for a run."""
        return self._run_budgets.get(verification_id, {})

    def _check_budget(self, verification_id: Optional[str], operation: str):
        """Check if the operation is within budget."""
        if not verification_id or verification_id not in self._run_budgets:
            return
        budget = self._run_budgets[verification_id]
        # Apply per-run limits based on config and operation type
        max_total = (
            settings.max_claims_per_run
            * (settings.queries_per_claim + 1 + settings.max_fetch_per_claim)
            + settings.max_agent_calls_per_run
            + 10  # buffer for retries
        )
        if budget.get("total_requests", 0) >= max_total:
            raise TinyFishBudgetExceeded(
                f"Per-run request budget exceeded ({budget['total_requests']}/{max_total})"
            )

    def _record_operation(
        self, verification_id: Optional[str], operation: str
    ):
        """Record an operation against the run budget."""
        if verification_id and verification_id in self._run_budgets:
            budget = self._run_budgets[verification_id]
            budget[operation] = budget.get(operation, 0) + 1
            budget["total_requests"] = budget.get("total_requests", 0) + 1

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        operation: str,
        verification_id: Optional[str] = None,
        params: Optional[dict] = None,
        json_body: Optional[dict] = None,
    ) -> tuple[httpx.Response, OperationRecord]:
        """
        Execute an HTTP request with retry logic.
        Returns the response and an operation record.
        """
        self._check_configured()
        self._check_budget(verification_id, operation)

        record = OperationRecord(
            provider="TINYFISH",
            operation=operation.upper(),
            status=OperationStatus.FAILED,
            retry_count=0,
            duration_ms=0,
            result_count=0,
            cache_hit=False,
        )

        last_error = None
        start_time = time.time()

        for attempt in range(self.MAX_RETRIES):
            record.retry_count = attempt

            try:
                async with self._semaphore:
                    async with httpx.AsyncClient(
                        timeout=self._get_timeout(operation)
                    ) as client:
                        response = await client.request(
                            method=method,
                            url=url,
                            headers=self._get_headers(),
                            params=params,
                            json=json_body,
                        )

                record.http_status = response.status_code
                record.duration_ms = (time.time() - start_time) * 1000

                # Success
                if response.status_code == 200:
                    record.status = OperationStatus.SUCCESS
                    self._record_operation(verification_id, operation)
                    return response, record

                # Auth failure — stop all further calls for this run
                if response.status_code == 401:
                    self._auth_failed = True
                    self._status = TinyFishStatus.AUTH_FAILED
                    raise TinyFishAuthError("Invalid TinyFish API key (401)")

                # Non-retryable errors
                if response.status_code in self.NON_RETRYABLE_STATUS_CODES:
                    record.error_code = f"HTTP_{response.status_code}"
                    raise TinyFishError(
                        f"TinyFish {operation} failed: HTTP {response.status_code}"
                    )

                # Rate limited
                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    wait = float(retry_after) if retry_after else (2 ** attempt + random.uniform(0, 1))
                    self._status = TinyFishStatus.RATE_LIMITED
                    if attempt < self.MAX_RETRIES - 1:
                        logger.warning(
                            f"TinyFish {operation} rate limited, waiting {wait:.1f}s (attempt {attempt + 1})"
                        )
                        await asyncio.sleep(wait)
                        continue
                    raise TinyFishRateLimited(retry_after=float(retry_after) if retry_after else None)

                # 5xx — retry
                if response.status_code >= 500:
                    wait = 2 ** attempt + random.uniform(0, 1)
                    if attempt < self.MAX_RETRIES - 1:
                        logger.warning(
                            f"TinyFish {operation} server error {response.status_code}, "
                            f"retrying in {wait:.1f}s (attempt {attempt + 1})"
                        )
                        await asyncio.sleep(wait)
                        continue
                    self._status = TinyFishStatus.UNAVAILABLE
                    raise TinyFishUnavailable(
                        f"TinyFish {operation} unavailable: HTTP {response.status_code}"
                    )

            except httpx.TimeoutException:
                wait = 2 ** attempt + random.uniform(0, 1)
                if attempt < self.MAX_RETRIES - 1:
                    logger.warning(
                        f"TinyFish {operation} timed out, retrying in {wait:.1f}s "
                        f"(attempt {attempt + 1})"
                    )
                    await asyncio.sleep(wait)
                    continue
                record.error_code = "TIMEOUT"
                raise TinyFishTimeout(f"TinyFish {operation} timed out after {self.MAX_RETRIES} attempts")

            except httpx.ConnectError:
                wait = 2 ** attempt + random.uniform(0, 1)
                if attempt < self.MAX_RETRIES - 1:
                    logger.warning(
                        f"TinyFish {operation} connection error, retrying in {wait:.1f}s "
                        f"(attempt {attempt + 1})"
                    )
                    await asyncio.sleep(wait)
                    continue
                record.error_code = "CONNECTION_ERROR"
                raise TinyFishUnavailable(f"TinyFish {operation} connection failed after {self.MAX_RETRIES} attempts")

        # Should not reach here
        raise TinyFishError(f"TinyFish {operation} failed after all retries")

    async def search(
        self,
        query: str,
        verification_id: Optional[str] = None,
        **kwargs,
    ) -> tuple[dict, OperationRecord]:
        """
        Execute a TinyFish Search.
        Returns raw response dict and operation record.
        """
        params = {"query": query}
        params.update({k: v for k, v in kwargs.items() if v is not None})

        response, record = await self._request_with_retry(
            method="GET",
            url=self.SEARCH_URL,
            operation="search",
            verification_id=verification_id,
            params=params,
        )
        record.result_count = len(response.json().get("results", []))
        return response.json(), record

    async def fetch(
        self,
        urls: list[str],
        verification_id: Optional[str] = None,
        format: str = "markdown",
        ttl: Optional[int] = None,
    ) -> tuple[dict, OperationRecord]:
        """
        Execute a TinyFish Fetch for one or more URLs (max 10).
        Returns raw response dict and operation record.
        """
        body = {"urls": urls, "format": format}
        if ttl is not None:
            body["ttl"] = ttl

        response, record = await self._request_with_retry(
            method="POST",
            url=self.FETCH_URL,
            operation="fetch",
            verification_id=verification_id,
            json_body=body,
        )
        data = response.json()
        record.result_count = len(data.get("results", []))
        return data, record

    async def agent_run(
        self,
        url: str,
        goal: str,
        verification_id: Optional[str] = None,
    ) -> tuple[dict, OperationRecord]:
        """
        Execute a TinyFish Agent run (synchronous mode).
        Returns raw response dict and operation record.
        """
        body = {"url": url, "goal": goal}

        response, record = await self._request_with_retry(
            method="POST",
            url=self.AGENT_URL,
            operation="agent",
            verification_id=verification_id,
            json_body=body,
        )
        return response.json(), record


# Singleton client instance
tinyfish_client = TinyFishClient()
