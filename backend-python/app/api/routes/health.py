"""
Health check endpoint - public (no internal token required).
Reports service status, LLM config, and TinyFish config without making paid calls.
"""

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Liveness and readiness check.
    Reports configuration state without making any paid API calls.
    """
    return {
        "service": "neural-proof-python",
        "status": "ok",
        "llm": {
            "configured": settings.llm_configured,
            "provider": settings.llm_provider if settings.llm_configured else None,
            "model": settings.llm_model if settings.llm_configured else None,
        },
        "tinyfish": {
            "configured": settings.tinyfish_configured,
            "mock_mode": settings.tinyfish_mock,
            "agent_enabled": settings.tinyfish_agent_enabled,
        },
        "environment": settings.app_env,
    }
