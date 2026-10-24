"""
Factory for resolving configured LLM providers.
"""

from typing import Optional
from app.core.config import settings
from app.services.llm.base import BaseLLMProvider, LLMNotConfiguredError


def get_llm_provider() -> BaseLLMProvider:
    """
    Returns the configured LLM provider.
    Raises LLMNotConfiguredError if no LLM key is configured.
    """
    if not settings.llm_configured:
        raise LLMNotConfiguredError("LLM API key is not configured in environment.")

    provider_name = settings.llm_provider.lower()

    if provider_name in ("openai", "azure"):
        from app.services.llm.openai_provider import OpenAIProvider
        return OpenAIProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model or "gpt-4o-mini",
        )
    elif provider_name == "anthropic":
        from app.services.llm.openai_provider import OpenAIProvider
        # Fallback to OpenAI compatible or generic
        return OpenAIProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model or "claude-3-5-sonnet-20241022",
        )
    else:
        # Default to OpenAI compatible interface (e.g. Groq, Ollama, etc.)
        from app.services.llm.openai_provider import OpenAIProvider
        return OpenAIProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
        )
