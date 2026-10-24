"""
Base class and interfaces for LLM providers.
"""

from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMError(Exception):
    """Base exception for LLM provider errors."""
    pass


class LLMNotConfiguredError(LLMError):
    """Raised when an LLM key is not configured."""
    pass


class LLMSchemaValidationError(LLMError):
    """Raised when the LLM output violates the required Pydantic schema."""
    pass


class BaseLLMProvider(ABC):
    """Abstract interface for LLM operations."""

    @abstractmethod
    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1000,
    ) -> str:
        """Generate plain text output."""
        pass

    @abstractmethod
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> T:
        """Generate structured output adhering to a Pydantic schema with validation."""
        pass
