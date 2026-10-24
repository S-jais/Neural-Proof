"""
Unit tests for PassageExtractor - Verbatim Substring Guarantee and BM25 scoring.
"""

import pytest
from app.integrations.tinyfish.models import FetchedPage
from app.services.passage_extractor import PassageExtractor


def test_passage_verbatim_guarantee():
    extractor = PassageExtractor()
    page_text = (
        "Introduction to Solar Energy Life Cycle.\n\n"
        "Photovoltaic panels produce no emissions during operation. However, the manufacturing "
        "phase requires significant mineral extraction and energy input, resulting in life-cycle "
        "greenhouse gas emissions between 20 and 50 grams of CO2-equivalent per kilowatt-hour.\n\n"
        "Decommissioning and recycling remain critical challenges for future deployments."
    )

    page = FetchedPage(
        url="https://nrel.gov/study",
        final_url="https://nrel.gov/study",
        normalized_url="https://nrel.gov/study",
        domain="nrel.gov",
        title="NREL Solar LCA",
        published_date="2023-01-01",
        retrieval_status="SUCCESS",
        content_text=page_text,
        content_char_count=len(page_text),
    )

    claim = {
        "normalized_text": "Solar energy produces 20 to 50 grams of CO2 per kilowatt-hour.",
        "original_text": "Solar energy produces 20 to 50 grams of CO2 per kilowatt-hour.",
        "entities": ["Solar energy", "CO2"],
    }

    passages = extractor.extract_passages(page=page, source_ordinal=1, claim=claim)

    assert len(passages) > 0
    for p in passages:
        # Crucial Anti-Fabrication Guarantee:
        # Every passage MUST exist verbatim in the source content!
        passage_text = p["passage_text"]
        assert passage_text in page_text
        # Offsets must match exactly
        assert page_text[p["char_start"]:p["char_end"]] == passage_text
        # ID format
        assert p["passage_id"].startswith("s1-p")
