"""
Source Ranker Service (D5).

Ranks candidate SearchHit objects using a transparent weighted scoring function:
- Lexical relevance of title and snippet to the claim
- Authority class heuristic based on domain/TLD rules from domain_heuristics.yaml
- Freshness weight for time-sensitive claims
- Directness indicator
- Domain diversity enforcement (at most 2 per domain)
"""

import os
import re
import yaml
from typing import List, Dict, Any, Tuple
from urllib.parse import urlparse

from app.integrations.tinyfish.models import SearchHit


class SourceRanker:
    """Ranks candidate search results and assigns heuristic source quality assessments."""

    def __init__(self, config_path: str = None):
        if not config_path:
            config_path = os.path.join(os.path.dirname(__file__), "domain_heuristics.yaml")
        
        self.heuristics = {"tlds": {}, "known_domains": {}}
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                self.heuristics = yaml.safe_load(f) or {}

    def classify_source(self, url: str, domain: str, claim_type: str = "OTHER") -> Dict[str, Any]:
        """
        Classifies domain into an authority class with rationale and signals.
        Always marked as a heuristic.
        """
        domain_lower = domain.lower()
        signals = []

        # 1. Check known domain exact/suffix match
        known = self.heuristics.get("known_domains", {})
        for source_class, domains in known.items():
            for d in domains:
                if domain_lower == d or domain_lower.endswith("." + d):
                    signals.append(f"Domain match: {d}")
                    return {
                        "source_class": source_class.upper(),
                        "signals": signals,
                        "rationale": f"Matched known reputable domain '{d}' categorized as {source_class}.",
                        "heuristic": True,
                    }

        # 2. Check TLD patterns
        tlds = self.heuristics.get("tlds", {})
        for source_class, tld_list in tlds.items():
            for tld in tld_list:
                if domain_lower.endswith(tld):
                    signals.append(f"TLD match: {tld}")
                    return {
                        "source_class": source_class.upper(),
                        "signals": signals,
                        "rationale": f"Matched TLD '{tld}' typically associated with {source_class}.",
                        "heuristic": True,
                    }

        # 3. Fallback
        return {
            "source_class": "OTHER_CREDIBLE",
            "signals": ["General web domain"],
            "rationale": "Standard web publication; not in specialized authority or low-quality lists.",
            "heuristic": True,
        }

    def score_candidate(
        self,
        hit: SearchHit,
        claim: Dict[str, Any],
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Computes composite ranking score for a candidate search hit.
        Returns (score, quality_assessment).
        """
        claim_text = (claim.get("normalized_text") or claim.get("original_text", "")).lower()
        claim_type = claim.get("claim_type", "OTHER")
        is_time_sensitive = claim.get("is_time_sensitive", False)
        entities = [e.lower() for e in claim.get("entities", [])]

        assessment = self.classify_source(hit.url, hit.domain, claim_type)
        source_class = assessment["source_class"]

        # 1. Authority Weight (0.0 to 1.0)
        # Contextual to claim_type
        authority_weight = 0.5
        if claim_type in ("SCIENTIFIC", "STATISTICAL") and source_class == "PRIMARY_RESEARCH_OR_DATASET":
            authority_weight = 1.0
        elif claim_type == "POLICY_OR_ELIGIBILITY" and source_class == "OFFICIAL_GOVERNMENT":
            authority_weight = 1.0
        elif source_class in ("OFFICIAL_GOVERNMENT", "INTERGOVERNMENTAL_OR_STANDARDS", "PRIMARY_RESEARCH_OR_DATASET"):
            authority_weight = 0.9
        elif source_class == "OFFICIAL_DOCUMENTATION":
            authority_weight = 0.85
        elif source_class == "ESTABLISHED_NEWS":
            authority_weight = 0.75
        elif source_class == "LOW_QUALITY_OR_UNKNOWN":
            authority_weight = 0.2

        # 2. Lexical Relevance (0.0 to 1.0)
        # Overlap with entities, numbers, and key terms in title & snippet
        combined_text = f"{hit.title} {hit.snippet}".lower()
        relevance_score = 0.0

        # Entity overlap
        if entities:
            matched_entities = sum(1 for e in entities if e in combined_text)
            relevance_score += 0.4 * (matched_entities / len(entities))
        else:
            relevance_score += 0.2

        # Numbers/digits overlap
        claim_numbers = re.findall(r"\b\d+(?:\.\d+)?%?\b", claim_text)
        if claim_numbers:
            matched_numbers = sum(1 for n in claim_numbers if n in combined_text)
            relevance_score += 0.3 * (matched_numbers / len(claim_numbers))

        # Key content words overlap
        claim_words = set(re.findall(r"\b[a-z]{4,}\b", claim_text))
        if claim_words:
            matched_words = sum(1 for w in claim_words if w in combined_text)
            relevance_score += 0.3 * min(1.0, matched_words / max(3, len(claim_words) // 2))

        # 3. Freshness weight
        freshness_score = 0.5
        if is_time_sensitive and hit.date:
            # Prefer recent dates
            if any(y in hit.date for y in ["2024", "2025", "2026"]):
                freshness_score = 1.0
            elif any(y in hit.date for y in ["2022", "2023"]):
                freshness_score = 0.7
            else:
                freshness_score = 0.3

        # 4. Directness
        # Does the snippet contain quotation or statement of the fact?
        directness_score = 0.5
        if any(w in hit.snippet.lower() for w in ["found that", "reports that", "according to", "stated", "show that"]):
            directness_score = 0.8

        total_score = (
            0.40 * relevance_score
            + 0.35 * authority_weight
            + 0.15 * freshness_score
            + 0.10 * directness_score
        )

        return total_score, assessment

    def rank_and_select(
        self,
        hits: List[SearchHit],
        claim: Dict[str, Any],
        max_fetch: int = 3,
    ) -> List[Tuple[SearchHit, float, Dict[str, Any]]]:
        """
        Ranks candidate hits and selects top candidates enforcing domain diversity
        (at most 2 candidates per domain).
        """
        scored = []
        for hit in hits:
            score, assessment = self.score_candidate(hit, claim)
            scored.append((hit, score, assessment))

        # Sort descending by score
        scored.sort(key=lambda x: x[1], reverse=True)

        selected = []
        domain_counts = {}

        for hit, score, assessment in scored:
            domain = hit.domain.lower()
            if domain_counts.get(domain, 0) >= 2:
                continue

            selected.append((hit, score, assessment))
            domain_counts[domain] = domain_counts.get(domain, 0) + 1

            if len(selected) >= max_fetch:
                break

        return selected
