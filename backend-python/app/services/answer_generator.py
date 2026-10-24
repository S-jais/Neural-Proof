"""
Answer Generator Service for Question Mode (C2).

Generates a concise, factual provisional answer.
Always labelled as AI-generated and unverified.
"""

from typing import Optional, Dict, Any
from app.core.config import settings
from app.services.llm.factory import get_llm_provider
from app.services.llm.base import LLMNotConfiguredError


class AnswerGeneratorService:
    """Generates provisional answer to user question."""

    async def generate_answer(
        self,
        question: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not settings.llm_configured:
            raise LLMNotConfiguredError(
                "Question mode is unavailable because LLM_API_KEY is not configured."
            )

        llm = get_llm_provider()
        system_prompt = (
            "You are a concise, factual AI assistant. "
            "Provide a direct, factual answer to the user's question in 2 to 4 sentences. "
            "State verifiable assertions clearly without speculation or conversational filler."
        )

        user_prompt = f"Question: {question}"
        if context:
            user_prompt += f"\nContext / Domain: {context}"

        answer_text = await llm.generate_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            max_tokens=400,
        )

        return {
            "answer": answer_text.strip(),
            "model": settings.llm_model,
            "warnings": [
                "Provisional AI-generated answer. All claims remain unverified until checked against retrieved evidence."
            ],
        }
