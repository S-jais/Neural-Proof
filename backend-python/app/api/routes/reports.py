"""Report summary endpoint."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(tags=["reports"])


class SummarizeRequest(BaseModel):
    counts: dict  # {supported, contradicted, partially_supported, insufficient_evidence, ...}
    claim_summaries: list[dict]  # [{claim_key, text, verdict, ...}]


@router.post("/reports/summarize")
async def summarize_report(request: SummarizeRequest):
    """Generate a narrative summary for a verification report."""
    from app.services.summary_service import SummaryService

    service = SummaryService()
    result = await service.generate_summary(
        counts=request.counts,
        claims=request.claim_summaries,
    )
    return result
