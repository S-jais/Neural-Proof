"""
TinyFish Search wrapper — returns internal SearchHit models.
Handles URL normalization and deduplication.
"""

import logging
from typing import Optional
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from app.integrations.tinyfish.client import tinyfish_client
from app.integrations.tinyfish.models import (
    SearchHit,
    TinyFishSearchResponse,
    TinyFishBadResponse,
    OperationRecord,
)

logger = logging.getLogger("neural_proof.tinyfish.search")


def normalize_url(url: str) -> str:
    """
    Normalize a URL for deduplication:
    - Lowercase host
    - Drop fragments
    - Remove tracking parameters (utm_*, fbclid, etc.)
    - Trim trailing slash
    """
    try:
        parsed = urlparse(url)
        host = parsed.hostname.lower() if parsed.hostname else ""
        path = parsed.path.rstrip("/") or "/"
        # Filter out tracking parameters
        tracking_prefixes = ("utm_", "fbclid", "gclid", "ref_", "source", "medium")
        if parsed.query:
            params = parse_qs(parsed.query, keep_blank_values=True)
            filtered = {
                k: v for k, v in params.items()
                if not any(k.lower().startswith(p) for p in tracking_prefixes)
            }
            query = urlencode(filtered, doseq=True)
        else:
            query = ""
        return urlunparse((parsed.scheme, host, path, "", query, ""))
    except Exception:
        return url


def extract_domain(url: str) -> str:
    """Extract clean domain from URL (without www. prefix)."""
    try:
        host = urlparse(url).hostname or ""
        return host.lower().removeprefix("www.")
    except Exception:
        return ""


async def search(
    query: str,
    verification_id: Optional[str] = None,
    location: str = "US",
    language: str = "en",
    **kwargs,
) -> tuple[list[SearchHit], OperationRecord]:
    """
    Execute a TinyFish Search and return internal SearchHit models.
    """
    raw_data, record = await tinyfish_client.search(
        query=query,
        verification_id=verification_id,
        location=location,
        language=language,
        **kwargs,
    )

    # Validate response
    try:
        response = TinyFishSearchResponse.model_validate(raw_data)
    except Exception as e:
        logger.error(f"TinyFish search response validation failed: {e}")
        raise TinyFishBadResponse(f"Invalid search response: {str(e)[:200]}")

    # Convert to internal models
    hits = []
    for result in response.results:
        normalized = normalize_url(result.url)
        hits.append(
            SearchHit(
                url=result.url,
                normalized_url=normalized,
                title=result.title,
                snippet=result.snippet,
                domain=extract_domain(result.url),
                position=result.position,
                date=result.date,
                publisher=result.publisher,
                query_used=query,
            )
        )

    record.result_count = len(hits)
    logger.info(
        f"Search for '{query[:50]}...' returned {len(hits)} results "
        f"(duration: {record.duration_ms:.0f}ms)"
    )
    return hits, record


class TinyFishSearch:
    """Wrapper class for TinyFish search operations."""

    def __init__(self, client=None):
        self.client = client or tinyfish_client

    async def search(self, query: str, verification_id: Optional[str] = None, **kwargs):
        return await search(query, verification_id=verification_id, **kwargs)

