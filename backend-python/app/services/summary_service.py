"""
Summary Service (C9).

Generates a concise narrative summary of verification findings from counts and per-claim one-liners.
Strict constraints:
- No accuracy percentage
- No stronger wording than the evidence
- Must mention incomplete claims, warnings, and unresolved conflicts
- Must not say 'verified' unless every included claim finished
- Provides deterministic template fallback if LLM is unavailable
"""

from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.llm.factory import get_llm_provider


class SummaryService:
    """Produces the final report summary."""

    async def generate_summary(
        self,
        counts: Dict[str, int],
        claims: List[Dict[str, Any]],
        conflicts_count: int = 0,
        warnings: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        warnings = warnings or []
        total = counts.get("total", len(claims))
        supported = counts.get("supported", 0)
        contradicted = counts.get("contradicted", 0)
        partial = counts.get("partially_supported", 0)
        insufficient = counts.get("insufficient_evidence", 0)
        not_completed = counts.get("not_completed", 0)

        # Deterministic template fallback
        template_text = self._build_template_summary(
            total=total,
            supported=supported,
            contradicted=contradicted,
            partial=partial,
            insufficient=insufficient,
            not_completed=not_completed,
            conflicts_count=conflicts_count,
        )

        if not settings.llm_configured:
            return {
                "summary": template_text,
                "method": "TEMPLATE",
                "warnings": warnings,
            }

        try:
            llm = get_llm_provider()
            system_prompt = (
                "You are an objective scientific verification reporter for Neural Proof.\n"
                "Write a 2 to 4 sentence executive summary of the verification findings.\n"
                "STRICT RULES:\n"
                "1. NEVER state an accuracy percentage or score.\n"
                "2. Do NOT use stronger wording than the evidence permits.\n"
                "3. Mention any contradicted claims, partially supported claims, or insufficient evidence.\n"
                "4. If any claims failed or were incomplete, mention that verification was partial.\n"
                "5. If there are unresolved conflicts, mention them explicitly.\n"
                "6. Do NOT say the text is 'verified' unless every claim finished with conclusive support."
            )

            claims_snippet = "\n".join(
                f"- Claim {c.get('claim_key')}: verdict={c.get('verdict')}; text: {c.get('normalized_text', '')[:100]}"
                for c in claims[:12]
            )

            user_prompt = (
                f"Verification counts: Total={total}, Supported={supported}, Contradicted={contradicted}, "
                f"Partially Supported={partial}, Insufficient Evidence={insufficient}, Not Completed={not_completed}.\n"
                f"Unresolved Conflicts: {conflicts_count}\n"
                f"Claims evaluated:\n{claims_snippet}"
            )

            summary_text = await llm.generate_text(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.1,
                max_tokens=250,
            )

            return {
                "summary": summary_text.strip(),
                "method": "LLM",
                "warnings": warnings,
            }
        except Exception:
            return {
                "summary": template_text,
                "method": "TEMPLATE",
                "warnings": warnings,
            }

    def _build_template_summary(
        self,
        total: int,
        supported: int,
        contradicted: int,
        partial: int,
        insufficient: int,
        not_completed: int,
        conflicts_count: int,
    ) -> str:
        parts = [f"Checked {total} factual claim{'s' if total != 1 else ''} against live web evidence."]

        findings = []
        if supported:
            findings.append(f"{supported} supported")
        if contradicted:
            findings.append(f"{contradicted} contradicted")
        if partial:
            findings.append(f"{partial} partially supported with needed qualifications")
        if insufficient:
            findings.append(f"{insufficient} with insufficient evidence to conclude")

        if findings:
            parts.append("Findings: " + "; ".join(findings) + ".")

        if conflicts_count > 0:
            parts.append(f"Identified {conflicts_count} material conflict{'s' if conflicts_count != 1 else ''} between retrieved sources.")

        if not_completed > 0:
            parts.append(f"Note: {not_completed} claim{'s were' if not_completed != 1 else ' was'} not completed due to retrieval or evaluation limits.")

        return " ".join(parts)
