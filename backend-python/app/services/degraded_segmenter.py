"""
Rule-based sentence segmenter for degraded mode (when LLM key is not configured).

Proposes claims directly from input sentences without requiring an LLM.
Retrieval and passage extraction run for real, but evaluation is skipped.
"""

import re
from typing import List, Dict, Any


class DegradedSegmenter:
    """Extracts candidate claims by splitting text into factual-like sentence segments."""

    SENTENCE_END = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9"\'\(\[])')

    def segment(self, text: str, max_claims: int = 12) -> List[Dict[str, Any]]:
        raw_sentences = self.SENTENCE_END.split(text.strip())
        claims = []
        ordinal = 1

        for raw_s in raw_sentences:
            s = raw_s.strip()
            if len(s) < 15:
                continue

            # Find character offsets in original text
            start = text.find(s)
            end = start + len(s) if start != -1 else None
            if start == -1:
                start = None

            # Simple heuristic detection for verifiable vs opinion/question
            is_question = s.endswith("?")
            is_opinion = any(
                w in s.lower()
                for w in ["i think", "i believe", "in my opinion", "should be", "arguably", "must definitely"]
            )
            is_verifiable = not (is_question or is_opinion)

            # Simple type heuristic
            claim_type = "OTHER"
            if any(char.isdigit() for char in s):
                if any(w in s.lower() for w in ["percent", "%", "average", "rate", "million", "billion"]):
                    claim_type = "STATISTICAL"
                elif any(w in s.lower() for w in ["year", "years", "century", "since", "in 19", "in 20"]):
                    claim_type = "DATE_OR_TIMELINE"
                else:
                    claim_type = "NUMERICAL"
            elif any(w in s.lower() for w in ["law", "policy", "eligible", "requirement", "regulation", "statute"]):
                claim_type = "POLICY_OR_ELIGIBILITY"
            elif any(w in s.lower() for w in ["study", "research", "scientists", "causes", "emissions", "energy"]):
                claim_type = "SCIENTIFIC"

            # Time sensitivity heuristic
            is_time_sensitive = any(
                w in s.lower()
                for w in ["current", "currently", "now", "recent", "today", "latest", "as of 20", "2024", "2025", "2026"]
            )

            # Generate basic query
            clean_words = [w for w in re.findall(r'\b\w+\b', s) if len(w) > 3][:8]
            query = " ".join(clean_words) if clean_words else s[:60]

            claim = {
                "claim_key": f"c{ordinal}",
                "original_text": s,
                "normalized_text": s,
                "span_start": start,
                "span_end": end,
                "claim_type": claim_type,
                "is_verifiable": is_verifiable,
                "non_verifiable_reason": "Identified as opinion or subjective statement." if is_opinion else ("Question sentence." if is_question else None),
                "is_time_sensitive": is_time_sensitive,
                "entities": [],
                "time_context": None,
                "qualifiers": [],
                "verification_query": query,
            }
            claims.append(claim)
            ordinal += 1

            if len(claims) >= max_claims:
                break

        return claims
