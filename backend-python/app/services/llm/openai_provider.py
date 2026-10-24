"""
OpenAI LLM provider implementation with structured output and repair retry.
"""

import json
import logging
from typing import Type, TypeVar
from pydantic import BaseModel, ValidationError

from app.services.llm.base import BaseLLMProvider, LLMError, LLMSchemaValidationError

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger("neural_proof.llm.openai")


class OpenAIProvider(BaseLLMProvider):
    """OpenAI provider using either native structured outputs or JSON schema mode with repair retry."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        from openai import AsyncOpenAI

        self.client = AsyncOpenAI(api_key=api_key, max_retries=0)
        self.model = model

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1000,
    ) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI generate_text error: {e}")
            raise LLMError(f"OpenAI call failed: {e}") from e

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
        temperature: float = 0.1,
        max_tokens: int = 2500,
    ) -> T:
        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        system_with_schema = (
            f"{system_prompt}\n\n"
            f"You MUST respond with a valid JSON object strictly matching this schema:\n"
            f"```json\n{schema_json}\n```\n"
            f"Return ONLY valid raw JSON with NO markdown wrappers or backticks."
        )

        messages = [
            {"role": "system", "content": system_with_schema},
            {"role": "user", "content": user_prompt},
        ]

        # First attempt
        raw_content = ""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
            raw_content = response.choices[0].message.content or "{}"
            parsed_json = json.loads(raw_content)
            return response_model.model_validate(parsed_json)
        except (json.JSONDecodeError, ValidationError) as err:
            logger.warning(f"Structured output attempt 1 failed validation: {err}. Attempting 1 repair retry.")
            # Repair retry (mandated by specification)
            repair_prompt = (
                f"Your previous JSON output was invalid or did not adhere to the schema.\n"
                f"Error: {str(err)}\n"
                f"Invalid output was:\n{raw_content[:1500]}\n\n"
                f"Please fix all schema violations and output ONLY the corrected JSON object."
            )
            repair_messages = list(messages) + [
                {"role": "assistant", "content": raw_content},
                {"role": "user", "content": repair_prompt},
            ]
            try:
                repair_response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=repair_messages,
                    temperature=0.0,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                )
                repaired_content = repair_response.choices[0].message.content or "{}"
                repaired_json = json.loads(repaired_content)
                return response_model.model_validate(repaired_json)
            except Exception as final_err:
                logger.error(f"Structured output repair retry failed: {final_err}")
                raise LLMSchemaValidationError(
                    f"Output schema validation failed after repair retry: {final_err}"
                ) from final_err
        except Exception as e:
            logger.error(f"OpenAI structured call failed: {e}")
            raise LLMError(f"OpenAI API error: {e}") from e
