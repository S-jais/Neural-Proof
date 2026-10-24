"""
Passage Extractor Service (D7: The Anti-Fabrication Mechanism).

Splits fetched documents into discrete passages, computes character offsets,
verifies that every passage is a 100% verbatim substring of the fetched content,
assigns stable IDs (s{source_ordinal}-p{n}), and scores passages against the claim.
"""

import math
import re
from typing import List, Dict, Any, Optional

from app.integrations.tinyfish.models import FetchedPage


class PassageExtractor:
    """Extracts verbatim, verifiable evidence passages from fetched page content."""

    def extract_passages(
        self,
        page: FetchedPage,
        source_ordinal: int,
        claim: Dict[str, Any],
        max_passages_per_source: int = 4,
    ) -> List[Dict[str, Any]]:
        """
        Splits clean text content into paragraphs/passages, verifies verbatim inclusion,
        scores relevance to claim, and returns top candidates.
        """
        raw_text = page.content_text
        if not raw_text or len(raw_text.strip()) < 40:
            return []

        # Split text into paragraphs / sections by double newlines or headings
        candidate_blocks = re.split(r"\n\s*\n|(?<=[.!?])\n(?=[#A-Z])", raw_text)
        passages = []
        claim_terms = set(self._tokenize(claim.get("normalized_text") or claim.get("original_text", "")))
        claim_entities = [e.lower() for e in claim.get("entities", [])]
        claim_numbers = set(re.findall(r"\b\d+(?:\.\d+)?%?\b", claim.get("original_text", "")))

        current_search_offset = 0

        for block in candidate_blocks:
            clean_block = block.strip()
            word_count = len(clean_block.split())
            if word_count < 15 or len(clean_block) < 60:
                continue

            # Sub-split blocks that are too long (> 300 words)
            chunks = self._chunk_long_block(clean_block)
            for chunk in chunks:
                # MANDATORY: Verbatim check in original content
                start_offset = raw_text.find(chunk, current_search_offset)
                if start_offset == -1:
                    start_offset = raw_text.find(chunk)

                if start_offset == -1:
                    # If direct find failed due to minor whitespace, verify normalized substring
                    continue

                end_offset = start_offset + len(chunk)
                current_search_offset = start_offset

                # Score passage against claim
                score = self._score_passage(chunk, claim_terms, claim_entities, claim_numbers)

                passages.append({
                    "passage_text": chunk,  # 100% verbatim slice
                    "char_start": start_offset,
                    "char_end": end_offset,
                    "relevance_score": score,
                    "word_count": len(chunk.split()),
                })

        # Sort descending by relevance score
        passages.sort(key=lambda p: p["relevance_score"], reverse=True)
        top_passages = passages[:max_passages_per_source]

        # Assign stable IDs s{source_ordinal}-p{n}
        assigned = []
        for n, p in enumerate(top_passages, start=1):
            assigned.append({
                "passage_id": f"s{source_ordinal}-p{n}",
                "source_url": page.final_url or page.url,
                "passage_text": p["passage_text"],
                "char_start": p["char_start"],
                "char_end": p["char_end"],
                "relevance_score": round(p["relevance_score"], 3),
            })

        return assigned

    def _chunk_long_block(self, text: str, max_words: int = 250) -> List[str]:
        words = text.split()
        if len(words) <= max_words:
            return [text]

        # Split on sentence boundaries
        sentences = re.split(r"(?<=[.!?])\s+", text)
        chunks = []
        current_chunk = []
        current_count = 0

        for s in sentences:
            s_words = len(s.split())
            if current_count + s_words > max_words and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [s]
                current_count = s_words
            else:
                current_chunk.append(s)
                current_count += s_words

        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    def _score_passage(
        self,
        passage: str,
        claim_terms: set[str],
        entities: List[str],
        numbers: set[str],
    ) -> float:
        """BM25-inspired lexical overlap boosted by entities and numbers."""
        passage_lower = passage.lower()
        passage_words = set(self._tokenize(passage))

        if not claim_terms:
            return 0.1

        # Term overlap
        overlap = len(claim_terms.intersection(passage_words))
        base_score = overlap / len(claim_terms)

        # Entity bonus
        entity_bonus = 0.0
        for entity in entities:
            if entity in passage_lower:
                entity_bonus += 0.25

        # Number bonus (critical for numerical assertions)
        number_bonus = 0.0
        for num in numbers:
            if num in passage_lower:
                number_bonus += 0.35

        return min(1.0, base_score + entity_bonus + number_bonus)

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_-]{3,}\b", text)]
