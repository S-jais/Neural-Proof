"""
TinyFish Pydantic models for validated responses and internal result types.

These models validate TinyFish API responses while tolerating unknown extra fields.
Internal result types provide a clean interface for the rest of the application.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# =============================================================================
# TinyFish API Response Models (tolerant of unknown fields)
# =============================================================================


class TinyFishSearchResult(BaseModel):
    """A single search result from TinyFish Search API."""

    position: Optional[int] = 1
    site_name: Optional[str] = None
    title: str
    snippet: str
    url: str
    date: Optional[str] = None
    publisher: Optional[str] = None

    model_config = {"extra": "allow"}


class TinyFishSearchResponse(BaseModel):
    """Response from TinyFish Search API."""

    query: Optional[str] = ""
    results: list[TinyFishSearchResult] = []
    total_results: int = 0
    page: int = 0

    model_config = {"extra": "allow"}


class TinyFishFetchResult(BaseModel):
    """A single fetched page from TinyFish Fetch API."""

    url: str
    final_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    author: Optional[str] = None
    published_date: Optional[str] = None
    text: Optional[str] = None
    latency_ms: Optional[float] = None
    format: str = "markdown"

    model_config = {"extra": "allow"}


class TinyFishFetchError(BaseModel):
    """A per-URL fetch error."""

    url: str
    error: str
    status: Optional[int] = None

    model_config = {"extra": "allow"}


class TinyFishFetchResponse(BaseModel):
    """Response from TinyFish Fetch API."""

    results: list[TinyFishFetchResult] = []
    errors: list[TinyFishFetchError] = []

    model_config = {"extra": "allow"}


# =============================================================================
# Internal Result Types
# =============================================================================


class RetrievalMethod(str, Enum):
    SEARCH_SNIPPET = "SEARCH_SNIPPET"
    FETCH = "FETCH"
    AGENT = "AGENT"


class RetrievalStatus(str, Enum):
    SUCCESS = "SUCCESS"
    TIMEOUT = "TIMEOUT"
    BLOCKED = "BLOCKED"
    NOT_FOUND = "NOT_FOUND"
    EMPTY_OR_PAYWALLED = "EMPTY_OR_PAYWALLED"
    UNSUPPORTED_CONTENT = "UNSUPPORTED_CONTENT"
    RATE_LIMITED = "RATE_LIMITED"
    API_ERROR = "API_ERROR"


class OperationStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CACHED = "CACHED"


class SearchHit(BaseModel):
    """Internal model for a search result."""

    url: str
    normalized_url: str
    title: str
    snippet: str
    domain: str
    position: int
    date: Optional[str] = None
    publisher: Optional[str] = None
    query_used: Optional[str] = ""


class FetchedPage(BaseModel):
    """Internal model for a fetched page."""

    url: str
    final_url: Optional[str] = None
    normalized_url: str
    title: Optional[str] = None
    description: Optional[str] = None
    domain: str
    author: Optional[str] = None
    published_date: Optional[str] = None
    content_text: Optional[str] = None
    content_hash: Optional[str] = None
    content_char_count: int = 0
    language: Optional[str] = None
    retrieval_method: RetrievalMethod = RetrievalMethod.FETCH
    retrieval_status: RetrievalStatus = RetrievalStatus.SUCCESS
    failure_reason: Optional[str] = None
    latency_ms: Optional[float] = None


class OperationRecord(BaseModel):
    """Record of a TinyFish or LLM operation for cost tracking."""

    provider: str  # TINYFISH or LLM
    operation: str  # SEARCH, FETCH, AGENT, EXTRACT, EVALUATE, etc.
    status: OperationStatus
    http_status: Optional[int] = None
    retry_count: int = 0
    duration_ms: float = 0
    result_count: int = 0
    cache_hit: bool = False
    error_code: Optional[str] = None


class TinyFishStatus(str, Enum):
    """Status of TinyFish connectivity."""

    OK = "OK"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    AUTH_FAILED = "AUTH_FAILED"
    RATE_LIMITED = "RATE_LIMITED"
    UNAVAILABLE = "UNAVAILABLE"


# =============================================================================
# Typed Exceptions
# =============================================================================


class TinyFishError(Exception):
    """Base TinyFish error."""
    pass


class TinyFishNotConfigured(TinyFishError):
    """API key not set."""
    pass


class TinyFishAuthError(TinyFishError):
    """Authentication failed (401)."""
    pass


class TinyFishRateLimited(TinyFishError):
    """Rate limited (429)."""
    def __init__(self, retry_after: Optional[float] = None):
        self.retry_after = retry_after
        super().__init__(f"Rate limited. Retry after: {retry_after}s")


class TinyFishTimeout(TinyFishError):
    """Request timed out."""
    pass


class TinyFishUnavailable(TinyFishError):
    """Service unavailable (5xx)."""
    pass


class TinyFishBadResponse(TinyFishError):
    """Response failed validation."""
    pass


class TinyFishBudgetExceeded(TinyFishError):
    """Per-run request budget exhausted."""
    pass

