"""
Conflict Detection Service (C8).

Validates and resolves conflicts proposed between opposing evidence passages.
Ensures distinct sources on each side and applies deterministic resolution rules.
"""

from typing import List, Dict, Any, Optional


class ConflictDetector:
    """Validates and processes evidence conflicts."""

    @staticmethod
    def validate_and_refine_conflicts(
        proposed_conflicts: List[Dict[str, Any]],
        passages_by_id: Dict[str, Dict[str, Any]],
        sources_by_url: Dict[str, Dict[str, Any]],
        is_time_sensitive: bool = False,
    ) -> List[Dict[str, Any]]:
        refined = []

        for conf in proposed_conflicts:
            side_a = [pid for pid in conf.get("side_a_passage_ids", []) if pid in passages_by_id]
            side_b = [pid for pid in conf.get("side_b_passage_ids", []) if pid in passages_by_id]

            # Conflict requires evidence on both sides
            if not side_a or not side_b:
                continue

            # Distinct source validation
            sources_a = {passages_by_id[pid].get("source_url") for pid in side_a}
            sources_b = {passages_by_id[pid].get("source_url") for pid in side_b}

            if sources_a == sources_b and len(sources_a) == 1:
                # Contradiction within the very same source: mark as internal ambiguity
                conf_type = "DEFINITION_OR_SCOPE"
            else:
                conf_type = conf.get("conflict_type", "FACTUAL_DISAGREEMENT")

            resolution = conf.get("resolution", "UNRESOLVED")
            resolution_basis = conf.get("resolution_basis", "Sources present conflicting factual claims.")

            # Apply temporal preference rule for time-sensitive claims
            if is_time_sensitive:
                dates_a = [sources_by_url.get(u, {}).get("publication_date") for u in sources_a if u]
                dates_b = [sources_by_url.get(u, {}).get("publication_date") for u in sources_b if u]
                valid_a = [d for d in dates_a if d]
                valid_b = [d for d in dates_b if d]

                if valid_a and valid_b and max(valid_a) > max(valid_b):
                    resolution = "PREFERRED_SIDE_A"
                    resolution_basis = f"Side A represents newer evidence ({max(valid_a)} vs {max(valid_b)}) for a time-sensitive assertion."
                elif valid_a and valid_b and max(valid_b) > max(valid_a):
                    resolution = "PREFERRED_SIDE_B"
                    resolution_basis = f"Side B represents newer evidence ({max(valid_b)} vs {max(valid_a)}) for a time-sensitive assertion."

            refined.append({
                "conflict_type": conf_type,
                "description": conf.get("description", "Disagreement found across retrieved sources."),
                "side_a_passage_ids": side_a,
                "side_b_passage_ids": side_b,
                "resolution": resolution,
                "resolution_basis": resolution_basis,
            })

        return refined
