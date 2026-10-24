"""
TinyFish Agent wrapper — bounded agent navigation for complex claims.
Only used under strict conditions defined in Part D8.
"""

import logging
from typing import Optional, Any

from app.core.config import settings
from app.integrations.tinyfish.client import tinyfish_client
from app.integrations.tinyfish.models import (
    FetchedPage,
    OperationRecord,
    RetrievalMethod,
    RetrievalStatus,
)
from app.integrations.tinyfish.search import normalize_url, extract_domain

logger = logging.getLogger("neural_proof.tinyfish.agent")


async def agent_navigate(
    url: str,
    goal: str,
    verification_id: Optional[str] = None,
) -> tuple[Optional[FetchedPage], OperationRecord]:
    """
    Execute a bounded TinyFish Agent navigation.

    Only called when ALL conditions hold (enforced by the caller):
    - TINYFISH_AGENT_ENABLED=true
    - Run's agent budget not exhausted
    - Claim is important (time-sensitive, policy, eligibility)
    - Regular Search+Fetch found no relevant passages
    - A plausible official site exists
    """
    if not settings.tinyfish_agent_enabled:
        from app.integrations.tinyfish.models import OperationStatus
        return None, OperationRecord(
            provider="TINYFISH",
            operation="AGENT",
            status=OperationStatus.FAILED,
            error_code="AGENT_DISABLED",
        )

    raw_data, record = await tinyfish_client.agent_run(
        url=url,
        goal=goal,
        verification_id=verification_id,
    )

    # Extract content from agent result
    # Agent results may have varying structure; extract what we can
    content = None
    if isinstance(raw_data, dict):
        # Try common fields from agent response
        content = raw_data.get("result", raw_data.get("output", raw_data.get("text", "")))
        if isinstance(content, dict):
            content = str(content)

    page = FetchedPage(
        url=url,
        normalized_url=normalize_url(url),
        domain=extract_domain(url),
        content_text=content or "",
        content_char_count=len(content) if content else 0,
        retrieval_method=RetrievalMethod.AGENT,
        retrieval_status=RetrievalStatus.SUCCESS if content else RetrievalStatus.EMPTY_OR_PAYWALLED,
    )

    logger.info(f"Agent navigation to {url}: {'success' if content else 'no content'}")
    return page, record


class TinyFishAgent:
    """Wrapper class for selective TinyFish Agent execution (D8)."""

    def __init__(self, client: Optional[Any] = None):
        self.client = client

    async def run_agent(
        self,
        url: str,
        goal: str,
        verification_id: Optional[str] = None,
    ) -> tuple[Optional[FetchedPage], OperationRecord]:
        return await agent_navigate(url=url, goal=goal, verification_id=verification_id)

