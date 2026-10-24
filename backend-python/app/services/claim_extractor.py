"""
Claim Extraction Service.

Decomposes text into individual verifiable factual assertions with character spans,
entities, qualifiers, time-sensitivity flags, and neutral verification queries.
Strictly forbids judging truth or verdicts during extraction.
"""

import json
import logging
import re
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.llm.factory import get_llm_provider
from app.services.llm.base import LLMNotConfiguredError, LLMError
from app.services.degraded_segmenter import DegradedSegmenter

logger = logging.getLogger("neural_proof.claim_extractor")

ClaimType = Literal[
    "NUMERICAL",
    "DATE_OR_TIMELINE",
    "NAMED_ENTITY_FACT",
    "POLICY_OR_ELIGIBILITY",
    "SCIENTIFIC",
    "CAUSAL",
    "DEFINITIONAL",
    "STATISTICAL",
    "OTHER",
]


class ExtractedClaim(BaseModel):
    """
    Schema for an extracted claim.
    MUST contain NO verdict, truth judgement, or confidence fields.
    """
    claim_key: str = Field(..., description="Stable key like c1, c2...")
    original_text: str = Field(..., description="Verbatim or near-verbatim text from input")
    normalized_text: str = Field(..., description="Self-contained statement with pronouns resolved")
    span_start: Optional[int] = Field(default=None, description="Character start offset in original text")
    span_end: Optional[int] = Field(default=None, description="Character end offset in original text")
    claim_type: ClaimType = Field(default="OTHER")
    is_verifiable: bool = Field(default=True, description="False for opinions, rhetoric, values")
    non_verifiable_reason: Optional[str] = Field(default=None)
    is_time_sensitive: bool = Field(default=False)
    entities: List[str] = Field(default_factory=list)
    time_context: Optional[str] = Field(default=None)
    qualifiers: List[str] = Field(default_factory=list)
    verification_query: str = Field(..., description="Neutral search rewrite preserving qualifiers")


class ClaimExtractionOutput(BaseModel):
    """Overall structured output for claim extraction."""
    claims: List[ExtractedClaim] = Field(default_factory=list)


EXTRACTION_SYSTEM_PROMPT = """You are an objective claim extraction engine for Neural Proof.
Your job is ONLY to decompose the provided text into individual, checkable factual claims.

RULES:
1. Identify distinct, verifiable factual assertions.
2. Split compound statements into individually checkable claims while preserving qualifiers (e.g. 'may', 'in most cases', 'since 2020', jurisdiction).
3. Record exact original wording.
4. Separate factual claims from opinions, recommendations, questions, and rhetorical statements. For non-factual statements, set is_verifiable=false and provide non_verifiable_reason.
5. Flag claims needing current or up-to-date information as is_time_sensitive=true.
6. Classify claim_type accurately into: NUMERICAL, DATE_OR_TIMELINE, NAMED_ENTITY_FACT, POLICY_OR_ELIGIBILITY, SCIENTIFIC, CAUSAL, DEFINITIONAL, STATISTICAL, OTHER.
7. Produce normalized_text: a standalone, self-contained factual assertion (resolve pronouns like 'it', 'they' using context, but DO NOT add any new facts).
8. Generate a short, neutral verification_query suitable for web search.
9. FORBIDDEN: You must NEVER judge the truth of any claim. DO NOT include any verdict, confidence, or opinion on whether a claim is true or false. Your only job is extraction.
"""


class ClaimExtractorService:
    """Service orchestrating claim extraction with LLM and degraded fallback."""

    def __init__(self):
        self.degraded_segmenter = DegradedSegmenter()

    async def extract(
        self,
        text: str,
        context: Optional[str] = None,
        max_claims: int = 12,
    ) -> Dict[str, Any]:
        """Extract claims from text, with span matching, deduplication, and degraded fallback."""
        # Check if LLM is configured
        if not settings.llm_configured:
            logger.info("LLM not configured. Using degraded sentence segmenter.")
            degraded_claims = self.degraded_segmenter.segment(text, max_claims=max_claims)
            return {
                "claims": degraded_claims,
                "warnings": [
                    "Automated LLM extraction unavailable (LLM_API_KEY missing). Used rule-based segmenter in degraded mode."
                ],
                "degraded": True,
            }

        try:
            llm = get_llm_provider()
            user_prompt = f"Original text to decompose:\n\"\"\"\n{text}\n\"\"\""
            if context:
                user_prompt += f"\n\nAdditional Context / Topic / Jurisdiction:\n{context}"
            user_prompt += f"\n\nExtract at most {max_claims} distinct assertions."

            result: ClaimExtractionOutput = await llm.generate_structured(
                system_prompt=EXTRACTION_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                response_model=ClaimExtractionOutput,
                temperature=0.1,
            )

            # Post-process: compute exact character spans in original text, normalize keys, merge duplicates
            processed_claims = []
            seen_texts = set()
            ordinal = 1

            for claim in result.claims:
                # Find span offsets if not exact
                norm_c = claim.normalized_text.lower().strip()
                if norm_c in seen_texts:
                    continue
                seen_texts.add(norm_c)

                # Locate character span in original text
                start, end = self._locate_span(claim.original_text, text)
                claim.span_start = start
                claim.span_end = end
                claim.claim_key = f"c{ordinal}"
                ordinal += 1

                processed_claims.append(claim.model_dump())
                if len(processed_claims) >= max_claims:
                    break

            return {
                "claims": processed_claims,
                "warnings": [],
                "degraded": False,
            }

        except Exception as e:
            logger.error(f"LLM claim extraction failed: {e}. Falling back to degraded segmenter.")
            degraded_claims = self.degraded_segmenter.segment(text, max_claims=max_claims)
            return {
                "claims": degraded_claims,
                "warnings": [
                    f"LLM claim extraction error: {str(e)}. Fell back to rule-based segmenter."
                ],
                "degraded": True,
            }

    def _locate_span(self, target: str, source: str) -> tuple[Optional[int], Optional[int]]:
        """Find character span of target in source, tolerating minor whitespace variations."""
        if not target or not source:
            return None, None

        # 1. Exact match
        idx = source.find(target)
        if idx != -1:
            return idx, idx + len(target)

        # 2. Case-insensitive match
        idx_lower = source.lower().find(target.lower())
        if idx_lower != -1:
            return idx_lower, idx_lower + len(target)

        # 3. Normalized whitespace regex
        escaped_words = [re.escape(w) for w in target.split() if w]
        if not escaped_words:
            return None, None
        pattern = r"\s+".join(escaped_words[:10])  # match first 10 words
        match = re.search(pattern, source, re.IGNORECASE)
        if match:
            return match.start(), match.end()

        return None, None
