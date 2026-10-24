"""
Neural Proof - FastAPI Application

Internal-only service providing AI and evidence pipeline capabilities.
All endpoints require X-Internal-Token authentication.
"""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import health, claims, answers, reports

logger = logging.getLogger("neural_proof")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    # Startup
    config_status = settings.startup_check()
    logger.info("Neural Proof Python backend starting")
    logger.info(f"Configuration: {config_status}")

    if settings.tinyfish_mock and settings.is_production:
        raise RuntimeError("TINYFISH_MOCK=true is refused when APP_ENV=production")

    yield
    # Shutdown
    logger.info("Neural Proof Python backend shutting down")


app = FastAPI(
    title="Neural Proof - AI Pipeline",
    description="Internal AI and evidence pipeline for Neural Proof",
    version="0.1.0",
    docs_url="/internal/docs" if not settings.is_production else None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.middleware("http")
async def auth_and_correlation_middleware(request: Request, call_next):
    """
    Enforce X-Internal-Token on all /internal/ endpoints.
    Propagate X-Correlation-Id for observability.
    """
    # Health endpoint is public
    if request.url.path == "/internal/v1/health":
        response = await call_next(request)
        return response

    # Check internal token for all /internal/ endpoints
    if request.url.path.startswith("/internal/"):
        token = request.headers.get("X-Internal-Token")
        if not token or not _constant_time_compare(token, settings.internal_service_token):
            return JSONResponse(
                status_code=403,
                content={
                    "code": "FORBIDDEN",
                    "message": "Invalid or missing internal service token",
                    "correlationId": request.headers.get("X-Correlation-Id", "unknown"),
                    "timestamp": time.time(),
                },
            )

    # Correlation ID
    correlation_id = request.headers.get("X-Correlation-Id", str(uuid.uuid4()))
    request.state.correlation_id = correlation_id
    request.state.verification_id = request.headers.get("X-Verification-Id")

    start_time = time.time()
    response = await call_next(request)
    duration = (time.time() - start_time) * 1000

    response.headers["X-Correlation-Id"] = correlation_id
    logger.info(
        f"{request.method} {request.url.path} "
        f"status={response.status_code} "
        f"duration_ms={duration:.1f} "
        f"correlation_id={correlation_id}"
    )
    return response


def _constant_time_compare(a: str, b: str) -> bool:
    """Constant-time string comparison to prevent timing attacks."""
    import hmac
    return hmac.compare_digest(a.encode(), b.encode())


# Register routes
app.include_router(health.router, prefix="/internal/v1")
app.include_router(claims.router, prefix="/internal/v1")
app.include_router(answers.router, prefix="/internal/v1")
app.include_router(reports.router, prefix="/internal/v1")


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
