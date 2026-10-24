"""
Neural Proof - Application Configuration

All settings read from environment variables with sensible defaults.
Secrets are never logged or returned in responses.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # --- Application ---
    app_env: str = Field(default="development", alias="APP_ENV")

    # --- Secrets ---
    tinyfish_api_key: Optional[str] = Field(default=None, alias="TINYFISH_API_KEY")
    llm_api_key: Optional[str] = Field(default=None, alias="LLM_API_KEY")
    internal_service_token: str = Field(
        default="change-me-to-a-random-secret", alias="INTERNAL_SERVICE_TOKEN"
    )

    # --- LLM ---
    llm_provider: str = Field(default="openai", alias="LLM_PROVIDER")
    llm_model: str = Field(default="gpt-4o-mini", alias="LLM_MODEL")

    # --- TinyFish ---
    tinyfish_mock: bool = Field(default=False, alias="TINYFISH_MOCK")
    tinyfish_agent_enabled: bool = Field(default=False, alias="TINYFISH_AGENT_ENABLED")

    # --- Cost Management ---
    max_claims_per_run: int = Field(default=12, alias="MAX_CLAIMS_PER_RUN")
    queries_per_claim: int = Field(default=2, alias="QUERIES_PER_CLAIM")
    max_search_results_per_claim: int = Field(default=8, alias="MAX_SEARCH_RESULTS_PER_CLAIM")
    max_fetch_per_claim: int = Field(default=3, alias="MAX_FETCH_PER_CLAIM")
    max_agent_calls_per_run: int = Field(default=2, alias="MAX_AGENT_CALLS_PER_RUN")
    tinyfish_max_concurrency: int = Field(default=4, alias="TINYFISH_MAX_CONCURRENCY")
    claim_concurrency: int = Field(default=3, alias="CLAIM_CONCURRENCY")

    # --- Timeouts ---
    tinyfish_connect_timeout: int = Field(default=10, alias="TINYFISH_CONNECT_TIMEOUT_SECONDS")
    tinyfish_search_timeout: int = Field(default=30, alias="TINYFISH_SEARCH_TIMEOUT_SECONDS")
    tinyfish_fetch_timeout: int = Field(default=160, alias="TINYFISH_FETCH_TIMEOUT_SECONDS")
    tinyfish_agent_timeout: int = Field(default=120, alias="TINYFISH_AGENT_TIMEOUT_SECONDS")
    run_total_timeout: int = Field(default=480, alias="RUN_TOTAL_TIMEOUT_SECONDS")
    fetch_cache_ttl: int = Field(default=3600, alias="FETCH_CACHE_TTL_SECONDS")

    # --- Input Limits ---
    input_min_chars_answer: int = Field(default=40, alias="INPUT_MIN_CHARS_ANSWER")
    input_max_chars_answer: int = Field(default=12000, alias="INPUT_MAX_CHARS_ANSWER")
    input_min_chars_question: int = Field(default=10, alias="INPUT_MIN_CHARS_QUESTION")
    input_max_chars_question: int = Field(default=1000, alias="INPUT_MAX_CHARS_QUESTION")
    input_max_chars_context: int = Field(default=600, alias="INPUT_MAX_CHARS_CONTEXT")

    # --- Feature flags ---
    enable_review_labels: bool = Field(default=False, alias="ENABLE_REVIEW_LABELS")

    # --- Max content per source ---
    max_content_chars_per_source: int = Field(default=60000, alias="MAX_CONTENT_CHARS_PER_SOURCE")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def tinyfish_configured(self) -> bool:
        return bool(self.tinyfish_api_key)

    @property
    def llm_configured(self) -> bool:
        return bool(self.llm_api_key)

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    def startup_check(self) -> dict[str, bool]:
        """Returns which settings are present (booleans only, never values)."""
        return {
            "tinyfish_api_key": self.tinyfish_configured,
            "llm_api_key": self.llm_configured,
            "internal_service_token": self.internal_service_token != "change-me-to-a-random-secret",
            "tinyfish_mock": self.tinyfish_mock,
            "tinyfish_agent_enabled": self.tinyfish_agent_enabled,
            "app_env": self.app_env,
        }


# Singleton
settings = Settings()
