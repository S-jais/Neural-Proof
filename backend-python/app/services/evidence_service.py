"""
Evidence Service (Part D: TinyFish Evidence Gathering).

Orchestrates research for a single claim:
- Generates queries (claim-oriented, authority, anti-confirmation bias)
- Executes TinyFish Search
- Ranks candidate results with authority heuristics and domain diversity
- Fetches top candidate pages using TinyFish Fetch
- Extracts verbatim passages with character offsets
- Evaluates selective escalation to TinyFish Agent (under Part D8 rules)
- Returns structured EvidenceBundle with operations logs
"""

import logging
import time
from typing import Dict, Any, Optional, List

from app.core.config import settings
from app.integrations.tinyfish.client import TinyFishClient
from app.integrations.tinyfish.search import TinyFishSearch
from app.integrations.tinyfish.fetch import TinyFishFetch
from app.integrations.tinyfish.agent import TinyFishAgent
from app.services.query_generator import QueryGenerator
from app.services.source_ranker import SourceRanker
from app.services.passage_extractor import PassageExtractor

logger = logging.getLogger("neural_proof.evidence_service")


class EvidenceService:
    """Coordinates TinyFish search, fetch, and passage extraction for a claim."""

    def __init__(self, client: Optional[TinyFishClient] = None):
        self.client = client or TinyFishClient()
        self.search = TinyFishSearch(client=self.client)
        self.fetch = TinyFishFetch(client=self.client)
        self.agent = TinyFishAgent(client=self.client)
        self.query_generator = QueryGenerator()
        self.source_ranker = SourceRanker()
        self.passage_extractor = PassageExtractor()

    async def research_claim(
        self,
        claim: Dict[str, Any],
        context: Optional[str] = None,
        run_budget: Optional[Dict[str, Any]] = None,
        verification_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Runs the complete research pipeline for one claim."""
        start_time = time.time()
        operations = []
        errors = []

        # 1. Generate queries
        queries = self.query_generator.generate_queries(
            claim=claim,
            context=context,
            max_queries=settings.queries_per_claim + 1,
        )

        all_hits = []
        seen_urls = set()

        # 2. TinyFish Search
        for q in queries:
            try:
                hits, op_record = await self.search.search(
                    query=q,
                    verification_id=verification_id,
                )
                operations.append(op_record.model_dump())
                for h in hits:
                    if h.url not in seen_urls:
                        seen_urls.add(h.url)
                        all_hits.append(h)
            except Exception as e:
                logger.warning(f"Search query '{q}' failed: {e}")
                errors.append(f"Search failed for '{q}': {str(e)}")

        if not all_hits and not operations:
            return {
                "sources": [],
                "passages": [],
                "operations": operations,
                "errors": errors or ["All search queries failed."],
            }

        # 3. Rank & Select Candidates for Fetch (with domain diversity)
        max_fetch = min(settings.max_fetch_per_claim, 3)
        selected_candidates = self.source_ranker.rank_and_select(
            hits=all_hits,
            claim=claim,
            max_fetch=max_fetch,
        )

        sources_to_store = []
        passages_to_store = []

        # 4. TinyFish Fetch
        urls_to_fetch = [hit.url for hit, _, _ in selected_candidates]
        fetched_pages = []
        if urls_to_fetch:
            try:
                fetched_pages, fetch_op = await self.fetch.fetch_urls(
                    urls=urls_to_fetch,
                    verification_id=verification_id,
                )
                operations.append(fetch_op.model_dump())
            except Exception as e:
                logger.error(f"TinyFish Fetch failed: {e}")
                errors.append(f"Fetch failed: {str(e)}")

        page_map = {p.url: p for p in fetched_pages}

        # 5. Extract Passages and Build Source Records
        source_ordinal = 1
        for hit, score, quality in selected_candidates:
            page = page_map.get(hit.url)
            retrieval_method = "FETCH" if page and page.retrieval_status == "SUCCESS" else "SEARCH_SNIPPET"

            source_record = {
                "url": hit.url,
                "normalized_url": hit.url.rstrip("/"),
                "domain": hit.domain,
                "title": (page.title if page and page.title else hit.title) or "Source",
                "publisher": hit.publisher or quality.get("rationale"),
                "source_class": quality.get("source_class", "OTHER_CREDIBLE"),
                "quality_assessment": quality,
                "publication_date": (page.published_date if page else hit.date),
                "last_updated_date": None,
                "date_origin": "API" if (page and page.published_date) or hit.date else None,
                "retrieval_method": retrieval_method,
                "retrieval_status": page.retrieval_status if page else "SUCCESS",
                "failure_reason": page.failure_reason if page else None,
                "snippet": hit.snippet,
                "content_text": page.content_text if page else None,
                "content_hash": page.content_hash if page else None,
                "content_char_count": page.content_char_count if page else 0,
            }
            sources_to_store.append(source_record)

            # Extract passages from fetched page if available
            if page and page.retrieval_status == "SUCCESS":
                extracted = self.passage_extractor.extract_passages(
                    page=page,
                    source_ordinal=source_ordinal,
                    claim=claim,
                    max_passages_per_source=4,
                )
                passages_to_store.extend(extracted)

            source_ordinal += 1

        # 6. Check Selective TinyFish Agent Escalation (D8)
        # Only when: agent enabled, budget remaining, claim is important/policy, and no high-relevance passages found
        if (
            settings.tinyfish_agent_enabled
            and not passages_to_store
            and claim.get("is_time_sensitive")
            and urls_to_fetch
        ):
            logger.info("Escalating to TinyFish Agent under D8 rules...")
            try:
                agent_res, agent_op = await self.agent.run_agent(
                    url=urls_to_fetch[0],
                    goal=f"Find official policy or latest factual data verifying: {claim.get('normalized_text')}",
                    verification_id=verification_id,
                )
                operations.append(agent_op.model_dump())
                if agent_res.output:
                    # Treat agent output as a source
                    agent_source = {
                        "url": agent_res.url,
                        "normalized_url": agent_res.url.rstrip("/"),
                        "domain": hit.domain,
                        "title": f"Agent Retrieval: {hit.domain}",
                        "publisher": "TinyFish Agent",
                        "source_class": "OTHER_CREDIBLE",
                        "quality_assessment": {"source_class": "OTHER_CREDIBLE", "heuristic": True},
                        "publication_date": None,
                        "last_updated_date": None,
                        "date_origin": None,
                        "retrieval_method": "AGENT",
                        "retrieval_status": "SUCCESS",
                        "failure_reason": None,
                        "snippet": agent_res.output[:300],
                        "content_text": agent_res.output,
                        "content_hash": None,
                        "content_char_count": len(agent_res.output),
                    }
                    sources_to_store.append(agent_source)
            except Exception as e:
                logger.warning(f"Agent escalation failed: {e}")

        # Limit total passages per claim to 8
        passages_to_store = passages_to_store[:8]

        return {
            "sources": sources_to_store,
            "passages": passages_to_store,
            "operations": operations,
            "errors": errors,
        }
