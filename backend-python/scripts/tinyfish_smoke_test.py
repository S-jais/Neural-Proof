"""
TinyFish Smoke Test Script (Mandatory Deliverable D12)

Reads TINYFISH_API_KEY from environment.
Runs one real Search for a harmless factual query:
  "When was the James Webb Space Telescope launched?"
Fetches the top valid result.
Validates responses with the production models.
Prints a sanitized summary (status, result count, domain, content length, latencies; NEVER the key).
Exits non-zero on any failure.
"""

import asyncio
import os
import sys
import time

# Ensure backend-python is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.integrations.tinyfish.client import TinyFishClient
from app.integrations.tinyfish.search import TinyFishSearch
from app.integrations.tinyfish.fetch import TinyFishFetch
from app.integrations.tinyfish.models import TinyFishStatus


async def run_smoke_test():
    print("=" * 60)
    print("TinyFish Integration Live Smoke Test (D12)")
    print("=" * 60)

    api_key = settings.tinyfish_api_key
    if not api_key:
        print("[FAIL] NOT RUN: TINYFISH_API_KEY is not configured in environment.")
        print("Please configure TINYFISH_API_KEY in .env before running this test.")
        sys.exit(1)

    # Sanitize: show only that a key is present, never any chars of the key
    print("[INFO] TINYFISH_API_KEY detected (redacted for security).")
    print(f"[INFO] Search timeout: {settings.tinyfish_search_timeout}s, Fetch timeout: {settings.tinyfish_fetch_timeout}s")

    client = TinyFishClient()
    search = TinyFishSearch(client=client)
    fetch = TinyFishFetch(client=client)

    test_query = "When was the James Webb Space Telescope launched?"
    print(f"[INFO] Step 1: Executing Search with query: '{test_query}'...")

    t0 = time.time()
    try:
        search_hits, search_op = await search.search(query=test_query)
        search_duration_ms = (time.time() - t0) * 1000
    except Exception as e:
        print(f"[FAIL] Search request failed: {type(e).__name__}: {str(e)}")
        sys.exit(2)

    print(f"[PASS] Search completed in {search_duration_ms:.1f}ms.")
    print(f"[INFO] Result count: {len(search_hits)}")

    if not search_hits:
        print("[FAIL] Search returned 0 results for harmless factual query.")
        sys.exit(3)

    first_hit = search_hits[0]
    print(f"[INFO] Top result title: '{first_hit.title}'")
    print(f"[INFO] Top result domain: {first_hit.domain}")
    print(f"[INFO] Top result URL: {first_hit.url}")

    print(f"[INFO] Step 2: Executing Fetch on top valid URL: {first_hit.url}...")
    t1 = time.time()
    try:
        pages, fetch_op = await fetch.fetch_urls(urls=[first_hit.url])
        fetch_duration_ms = (time.time() - t1) * 1000
    except Exception as e:
        print(f"[FAIL] Fetch request failed: {type(e).__name__}: {str(e)}")
        sys.exit(4)

    print(f"[PASS] Fetch completed in {fetch_duration_ms:.1f}ms.")
    print(f"[INFO] Pages retrieved: {len(pages)}")

    if not pages:
        print("[FAIL] Fetch returned 0 pages.")
        sys.exit(5)

    first_page = pages[0]
    print(f"[INFO] Page status: {first_page.retrieval_status}")
    print(f"[INFO] Page title: '{first_page.title}'")
    print(f"[INFO] Page content length: {first_page.content_char_count} chars")
    print(f"[INFO] Content hash: {first_page.content_hash}")

    if first_page.retrieval_status != "SUCCESS":
        print(f"[FAIL] Page retrieval status was {first_page.retrieval_status}: {first_page.failure_reason}")
        sys.exit(6)

    print("=" * 60)
    print("SUMMARY OF SMOKE TEST:")
    print(f"  TinyFish Status:      OK")
    print(f"  Search Results:       {len(search_hits)}")
    print(f"  Top Domain:           {first_hit.domain}")
    print(f"  Search Latency:       {search_duration_ms:.1f} ms")
    print(f"  Fetch Latency:        {fetch_duration_ms:.1f} ms")
    print(f"  Content Chars:        {first_page.content_char_count}")
    print("Result: ALL PRODUCTION MODELS AND INTEGRATION CHECKS PASSED.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_smoke_test())
