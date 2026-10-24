"""
TinyFish Fetch wrapper — returns internal FetchedPage models.
Handles content truncation, hashing, metadata extraction, and failure classification.
"""

import hashlib
import logging
import re
from typing import Optional
from urllib.parse import urlparse

from app.core.config import settings
from app.integrations.tinyfish.client import tinyfish_client
from app.integrations.tinyfish.models import (
    FetchedPage,
    TinyFishFetchResponse,
    TinyFishBadResponse,
    OperationRecord,
    RetrievalMethod,
    RetrievalStatus,
)
from app.integrations.tinyfish.search import normalize_url, extract_domain

logger = logging.getLogger("neural_proof.tinyfish.fetch")

# Map TinyFish per-URL error codes to our retrieval statuses
_ERROR_STATUS_MAP = {
    "target_http_error": RetrievalStatus.API_ERROR,
    "page_not_found": RetrievalStatus.NOT_FOUND,
    "target_unreachable": RetrievalStatus.API_ERROR,
    "timeout": RetrievalStatus.TIMEOUT,
    "bot_blocked": RetrievalStatus.BLOCKED,
    "empty_content": RetrievalStatus.EMPTY_OR_PAYWALLED,
    "login_required": RetrievalStatus.EMPTY_OR_PAYWALLED,
    "content_too_large": RetrievalStatus.UNSUPPORTED_CONTENT,
    "invalid_url": RetrievalStatus.API_ERROR,
    "invalid_redirect_url": RetrievalStatus.API_ERROR,
    "proxy_error": RetrievalStatus.API_ERROR,
}

# URL safety validation patterns
_PRIVATE_IP_PATTERNS = [
    re.compile(r"^10\."),
    re.compile(r"^172\.(1[6-9]|2[0-9]|3[01])\."),
    re.compile(r"^192\.168\."),
    re.compile(r"^127\."),
    re.compile(r"^169\.254\."),
    re.compile(r"^0\."),
    re.compile(r"^::1$"),
    re.compile(r"^fe80:"),
    re.compile(r"^fc00:"),
    re.compile(r"^fd00:"),
]

_METADATA_HOSTS = ["169.254.169.254", "metadata.google.internal"]


def validate_url_safety(url: str) -> bool:
    """
    Validate URL safety: only http/https, no credentials, no private/metadata IPs.
    Returns True if safe, False if rejected.
    """
    try:
        parsed = urlparse(url)

        # Scheme check
        if parsed.scheme not in ("http", "https"):
            return False

        # Credentials check
        if parsed.username or parsed.password:
            return False

        host = parsed.hostname or ""

        # Localhost check
        if host in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
            return False

        # Metadata IP check
        if host in _METADATA_HOSTS:
            return False

        # Private IP check
        for pattern in _PRIVATE_IP_PATTERNS:
            if pattern.match(host):
                return False

        return True
    except Exception:
        return False


async def fetch_urls(
    urls: list[str],
    verification_id: Optional[str] = None,
    ttl: Optional[int] = None,
) -> tuple[list[FetchedPage], OperationRecord]:
    """
    Fetch one or more URLs via TinyFish Fetch and return FetchedPage models.
    Validates URL safety before fetching.
    """
    # Validate all URLs
    safe_urls = []
    rejected_pages = []
    for url in urls:
        if validate_url_safety(url):
            safe_urls.append(url)
        else:
            rejected_pages.append(
                FetchedPage(
                    url=url,
                    normalized_url=normalize_url(url),
                    domain=extract_domain(url),
                    retrieval_method=RetrievalMethod.FETCH,
                    retrieval_status=RetrievalStatus.API_ERROR,
                    failure_reason="URL rejected: unsafe scheme, credentials, or private IP",
                )
            )

    if not safe_urls:
        from app.integrations.tinyfish.models import OperationRecord, OperationStatus
        record = OperationRecord(
            provider="TINYFISH",
            operation="FETCH",
            status=OperationStatus.FAILED,
            error_code="ALL_URLS_REJECTED",
        )
        return rejected_pages, record

    # Fetch via TinyFish
    raw_data, record = await tinyfish_client.fetch(
        urls=safe_urls,
        verification_id=verification_id,
        format="markdown",
        ttl=ttl,
    )

    # Validate response
    try:
        response = TinyFishFetchResponse.model_validate(raw_data)
    except Exception as e:
        logger.error(f"TinyFish fetch response validation failed: {e}")
        raise TinyFishBadResponse(f"Invalid fetch response: {str(e)[:200]}")

    # Process successful results
    pages = list(rejected_pages)
    for result in response.results:
        content = result.text or ""

        # Truncate to configured max
        original_length = len(content)
        if len(content) > settings.max_content_chars_per_source:
            content = content[:settings.max_content_chars_per_source]

        content_hash = hashlib.sha256(content.encode()).hexdigest() if content else None

        pages.append(
            FetchedPage(
                url=result.url,
                final_url=result.final_url,
                normalized_url=normalize_url(result.final_url or result.url),
                title=result.title,
                description=result.description,
                domain=extract_domain(result.final_url or result.url),
                author=result.author,
                published_date=result.published_date,
                content_text=content,
                content_hash=content_hash,
                content_char_count=original_length,
                language=result.language,
                retrieval_method=RetrievalMethod.FETCH,
                retrieval_status=RetrievalStatus.SUCCESS,
                latency_ms=result.latency_ms,
            )
        )

    # Process errors
    for error in response.errors:
        status = _ERROR_STATUS_MAP.get(error.error, RetrievalStatus.API_ERROR)
        pages.append(
            FetchedPage(
                url=error.url,
                normalized_url=normalize_url(error.url),
                domain=extract_domain(error.url),
                retrieval_method=RetrievalMethod.FETCH,
                retrieval_status=status,
                failure_reason=error.error,
            )
        )

    record.result_count = len(response.results)
    logger.info(
        f"Fetched {len(safe_urls)} URLs: {len(response.results)} succeeded, "
        f"{len(response.errors)} failed (duration: {record.duration_ms:.0f}ms)"
    )
    return pages, record


class TinyFishFetch:
    """Wrapper class for TinyFish fetch operations."""

    def __init__(self, client=None):
        self.client = client or tinyfish_client

    async def fetch_urls(self, urls: list[str], verification_id: Optional[str] = None, **kwargs):
        return await fetch_urls(urls, verification_id=verification_id, **kwargs)

    def _is_safe_url(self, url: str) -> bool:
        return validate_url_safety(url)

