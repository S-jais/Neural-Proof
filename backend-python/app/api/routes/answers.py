"""Answer generation endpoint for question mode."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(tags=["answers"])


class GenerateAnswerRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=1000)
    context: Optional[str] = Field(default=None, max_length=600)


@router.post("/answers/generate")
async def generate_answer(request: GenerateAnswerRequest):
    """Generate a provisional AI answer for a question."""
    from app.services.answer_generator import AnswerGeneratorService

    generator = AnswerGeneratorService()
    result = await generator.generate_answer(
        question=request.question,
        context=request.context,
    )
    return result
