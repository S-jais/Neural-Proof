"""
Claims API routes - claim extraction, research, and evaluation endpoints.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(tags=["claims"])


class ExtractClaimsRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=12000)
    context: Optional[str] = Field(default=None, max_length=600)
    max_claims: int = Field(default=12, ge=1, le=20)


class ResearchClaimRequest(BaseModel):
    claim: dict  # Full claim object
    context: Optional[str] = None
    run_budget: Optional[dict] = None  # Remaining budget info


class EvaluateClaimRequest(BaseModel):
    claim: dict  # Full claim object
    evidence_bundle: dict  # Sources, passages, operations


@router.post("/claims/extract")
async def extract_claims(request: ExtractClaimsRequest, req: Request):
    """Extract verifiable factual claims from text."""
    from app.services.claim_extractor import ClaimExtractorService

    extractor = ClaimExtractorService()
    result = await extractor.extract(
        text=request.text,
        context=request.context,
        max_claims=request.max_claims,
    )
    return result


@router.post("/claims/research")
async def research_claim(request: ResearchClaimRequest, req: Request):
    """Research a single claim using TinyFish Search and Fetch."""
    from app.services.evidence_service import EvidenceService

    service = EvidenceService()
    result = await service.research_claim(
        claim=request.claim,
        context=request.context,
        run_budget=request.run_budget,
        verification_id=req.state.verification_id,
    )
    return result


@router.post("/claims/evaluate")
async def evaluate_claim(request: EvaluateClaimRequest, req: Request):
    """Evaluate a claim against its retrieved evidence."""
    from app.services.claim_verifier import ClaimVerifierService

    verifier = ClaimVerifierService()
    result = await verifier.evaluate(
        claim=request.claim,
        evidence_bundle=request.evidence_bundle,
    )
    return result
