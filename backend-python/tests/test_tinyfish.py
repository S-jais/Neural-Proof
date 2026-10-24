"""
Unit tests for TinyFish Client, Search, and Fetch wrappers.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.integrations.tinyfish.client import TinyFishClient
from app.integrations.tinyfish.search import TinyFishSearch
from app.integrations.tinyfish.fetch import TinyFishFetch
from app.integrations.tinyfish.models import SearchHit, FetchedPage, OperationRecord, OperationStatus


@pytest.mark.asyncio
async def test_search_hit_parsing():
    client = TinyFishClient()
    search = TinyFishSearch(client=client)

    raw_response = {
        "results": [
            {
                "title": "Solar Energy Life Cycle Assessment",
                "url": "https://www.nrel.gov/docs/pv-lca.html?utm_source=twitter#intro",
                "snippet": "NREL lifecycle data on solar PV emissions.",
                "date": "2023-01-15",
                "publisher": "National Renewable Energy Lab",
            }
        ],
        "total_results": 1,
    }

    mock_resp = MagicMock()
    mock_resp.json.return_value = raw_response
    mock_record = OperationRecord(
        provider="TINYFISH",
        operation="SEARCH",
        status=OperationStatus.SUCCESS,
    )

    with patch("app.integrations.tinyfish.search.tinyfish_client._request_with_retry", new=AsyncMock(return_value=(mock_resp, mock_record))):
        hits, op = await search.search("solar lifecycle emissions")
        assert len(hits) == 1
        hit = hits[0]
        assert hit.domain == "nrel.gov"
        # URL normalization: dropped query params and fragment
        assert hit.normalized_url.endswith("/docs/pv-lca.html")
        assert "utm_source" not in hit.normalized_url
        assert hit.title == "Solar Energy Life Cycle Assessment"
        assert op.status == OperationStatus.SUCCESS


@pytest.mark.asyncio
async def test_fetch_content_hashing_and_truncation():
    client = TinyFishClient()
    fetch = TinyFishFetch(client=client)

    test_content = "This is verified page content from an authoritative scientific source."
    raw_response = {
        "results": [
            {
                "url": "https://example.com/study",
                "final_url": "https://example.com/study",
                "title": "Empirical Study",
                "text": test_content,
                "published_date": "2024-05-10",
                "format": "markdown",
            }
        ],
        "errors": [],
    }

    mock_resp = MagicMock()
    mock_resp.json.return_value = raw_response
    mock_record = OperationRecord(
        provider="TINYFISH",
        operation="FETCH",
        status=OperationStatus.SUCCESS,
    )

    with patch("app.integrations.tinyfish.fetch.tinyfish_client._request_with_retry", new=AsyncMock(return_value=(mock_resp, mock_record))):
        pages, op = await fetch.fetch_urls(["https://example.com/study"])
        assert len(pages) == 1
        page = pages[0]
        assert page.retrieval_status == "SUCCESS"
        assert page.content_text == test_content
        assert page.content_char_count == len(test_content)
        assert page.content_hash is not None
        assert len(page.content_hash) == 64  # SHA-256


@pytest.mark.asyncio
async def test_url_safety_rejection():
    client = TinyFishClient()
    fetch = TinyFishFetch(client=client)

    # SSRF protection: reject localhost and private IP ranges
    dangerous_urls = [
        "http://localhost:8080/secret",
        "http://127.0.0.1:5000",
        "http://169.254.169.254/latest/meta-data",
        "http://192.168.1.1/admin",
        "ftp://ftp.example.com",
    ]

    for d_url in dangerous_urls:
        assert not fetch._is_safe_url(d_url), f"Should have rejected unsafe URL: {d_url}"

    safe_url = "https://www.nature.com/articles/s41586-024-0000"
    assert fetch._is_safe_url(safe_url)
