"""
Query Generation Service for Evidence Retrieval.

Generates targeted queries per claim:
1. Precise claim-oriented query preserving entities, numbers, and qualifiers.
2. Authority-oriented query naming the likely official/primary source type or jurisdiction.
3. Counter-evidence query for strong/absolute claims to prevent confirmation bias.
"""

import re
from typing import List, Dict, Any, Optional

ABSOLUTE_TERMS = {
    "zero", "never", "always", "none", "100%", "all", "only", "impossible",
    "entirely", "completely", "guaranteed", "flawless", "infinite", "every",
}


class QueryGenerator:
    """Generates neutral, balanced search queries for TinyFish retrieval."""

    def generate_queries(
        self,
        claim: Dict[str, Any],
        context: Optional[str] = None,
        max_queries: int = 3,
    ) -> List[str]:
        queries = []
        text = claim.get("normalized_text") or claim.get("original_text", "")
        entities = claim.get("entities") or []
        claim_type = claim.get("claim_type", "OTHER")
        is_time_sensitive = claim.get("is_time_sensitive", False)
        verification_query = claim.get("verification_query", "")

        # 1. Query 1: Precise claim-oriented query
        # Strip common assertion prefixes like "It is claimed that"
        clean_text = re.sub(r"^(the claim that|it is stated that|according to)\s+", "", text, flags=re.IGNORECASE)
        # Preserve numbers and qualifiers
        words = clean_text.split()
        if len(words) > 10:
            # Keep key entities + predicate words
            q1 = verification_query if verification_query else " ".join(words[:10])
        else:
            q1 = clean_text.rstrip(".!?")
        
        if context and context.lower() not in q1.lower():
            q1 = f"{q1} {context}"
        queries.append(q1.strip())

        # 2. Query 2: Authority-oriented query
        authority_hint = self._get_authority_hint(claim_type)
        entity_str = " ".join(entities[:3]) if entities else " ".join(words[:5])
        
        q2_parts = [entity_str]
        if authority_hint:
            q2_parts.append(authority_hint)
        if is_time_sensitive:
            # Add recent year hint
            q2_parts.append("report official data 2024 2025")
        
        q2 = " ".join(q2_parts).strip()
        if q2 and q2.lower() != q1.lower():
            queries.append(q2)

        # 3. Query 3: Counter-evidence query for strong/absolute claims (Anti-confirmation bias)
        has_absolute = any(term in text.lower().split() for term in ABSOLUTE_TERMS)
        if has_absolute and len(queries) < max_queries:
            counter_query = self._build_counter_query(text, entities)
            if counter_query and counter_query not in queries:
                queries.append(counter_query)

        return queries[:max_queries]

    def _get_authority_hint(self, claim_type: str) -> str:
        hints = {
            "SCIENTIFIC": "study peer-reviewed research findings",
            "POLICY_OR_ELIGIBILITY": "official government regulations policy eligibility",
            "NUMERICAL": "statistics dataset report official figures",
            "STATISTICAL": "official statistics survey data methodology",
            "DATE_OR_TIMELINE": "timeline official history date established",
            "NAMED_ENTITY_FACT": "official site documentation overview",
            "DEFINITIONAL": "definition standard technical specification",
        }
        return hints.get(claim_type, "official source report")

    def _build_counter_query(self, text: str, entities: List[str]) -> str:
        entity_str = " ".join(entities[:2]) if entities else " ".join(text.split()[:4])
        # Look for negative/contradictory evidence
        return f"{entity_str} criticisms limitations environmental impact counter evidence disadvantages"
