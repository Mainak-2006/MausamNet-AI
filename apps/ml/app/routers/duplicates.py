from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import DUPLICATE_THRESHOLD
from app.services.duplicates import detect_duplicates

router = APIRouter(prefix="/duplicates", tags=["duplicates"])


class DuplicateInput(BaseModel):
    text: str
    existing_texts: list[str] = []
    threshold: float | None = None


class DuplicateResponse(BaseModel):
    is_duplicate: bool
    similar_to_index: int | None
    similarity_score: float
    duplicate_of: str | None = None


@router.post("/", response_model=DuplicateResponse)
async def detect_duplicates_endpoint(input: DuplicateInput) -> dict[str, Any]:
    """Detect whether a report is a duplicate of an existing one."""
    threshold = input.threshold if input.threshold is not None else DUPLICATE_THRESHOLD
    return detect_duplicates(input.text, input.existing_texts, threshold=threshold)
