"""
Unit tests for QueryGenerator, SourceRanker, DegradedSegmenter, and ConflictDetector.
"""

import pytest
from app.services.query_generator import QueryGenerator
from app.services.source_ranker import SourceRanker
from app.services.degraded_segmenter import DegradedSegmenter
from app.services.conflict_detector import ConflictDetector
from app.integrations.tinyfish.models import SearchHit


def test_query_generator_anti_bias():
    gen = QueryGenerator()
    # An absolute claim must generate a counter-evidence query
    claim = {
        "normalized_text": "Solar energy has zero environmental impact and is 100% clean.",
        "original_text": "Solar energy has zero environmental impact.",
        "claim_type": "SCIENTIFIC",
        "entities": ["Solar energy"],
    }
    queries = gen.generate_queries(claim=claim, max_queries=3)
    assert len(queries) >= 2
    # Verify counter-evidence query was included
    assert any("criticisms" in q or "counter" in q or "environmental impact" in q for q in queries)


def test_degraded_segmenter():
    segmenter = DegradedSegmenter()
    text = (
        "Electric vehicles produce zero tailpipe emissions. "
        "However, battery production accounts for over 40% of their lifecycle emissions. "
        "Do you think they are truly sustainable?"
    )
    claims = segmenter.segment(text, max_claims=5)
    assert len(claims) >= 2

    # Check that the question was marked is_verifiable=False
    question_claims = [c for c in claims if not c["is_verifiable"]]
    assert len(question_claims) > 0
    assert question_claims[0]["non_verifiable_reason"] is not None


def test_source_ranker_authority():
    ranker = SourceRanker()
    claim = {
        "normalized_text": "Federal solar tax credit was extended until 2034.",
        "claim_type": "POLICY_OR_ELIGIBILITY",
        "entities": ["solar tax credit"],
    }

    hit_gov = SearchHit(
        url="https://energy.gov/clean-energy/tax-credit",
        normalized_url="https://energy.gov/clean-energy/tax-credit",
        title="Residential Clean Energy Credit | Department of Energy",
        snippet="Official federal guidelines on the 30% solar tax credit through 2034.",
        domain="energy.gov",
        position=1,
    )

    hit_blog = SearchHit(
        url="https://randomsolarforum.com/thread/123",
        normalized_url="https://randomsolarforum.com/thread/123",
        title="Solar credits forum chat",
        snippet="People talking about solar tax credits.",
        domain="randomsolarforum.com",
        position=2,
    )

    score_gov, quality_gov = ranker.score_candidate(hit_gov, claim)
    score_blog, quality_blog = ranker.score_candidate(hit_blog, claim)

    assert score_gov > score_blog
    assert quality_gov["source_class"] == "OFFICIAL_GOVERNMENT"


def test_conflict_detector_temporal_rule():
    detector = ConflictDetector()
    proposed = [
        {
            "conflict_type": "FACTUAL_DISAGREEMENT",
            "description": "Disagreement on solar panel efficiency record.",
            "side_a_passage_ids": ["s1-p1"],
            "side_b_passage_ids": ["s2-p1"],
            "resolution": "UNRESOLVED",
            "resolution_basis": "Conflicting data points.",
        }
    ]

    passages = {
        "s1-p1": {"source_url": "https://nrel.gov/2024-report"},
        "s2-p1": {"source_url": "https://university.edu/2021-paper"},
    }

    sources = {
        "https://nrel.gov/2024-report": {"domain": "nrel.gov", "publication_date": "2024-06-01"},
        "https://university.edu/2021-paper": {"domain": "university.edu", "publication_date": "2021-03-15"},
    }

    refined = detector.validate_and_refine_conflicts(
        proposed_conflicts=proposed,
        passages_by_id=passages,
        sources_by_url=sources,
        is_time_sensitive=True,
    )

    assert len(refined) == 1
    # Temporal preference selects newer source (2024 > 2021) for time-sensitive claim
    assert refined[0]["resolution"] == "PREFERRED_SIDE_A"
    assert "2024-06-01" in refined[0]["resolution_basis"]
