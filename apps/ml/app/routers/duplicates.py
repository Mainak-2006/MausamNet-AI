from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/duplicates", tags=["duplicates"])


class DuplicateInput(BaseModel):
    text: str
    existing_texts: list[str] = []


class DuplicateResponse(BaseModel):
    is_duplicate: bool
    similarity: float
    duplicate_of: str | None = None


@router.post("/", response_model=DuplicateResponse)
async def detect_duplicates(input: DuplicateInput):
    """Detect duplicate weather reports (placeholder)."""
    return DuplicateResponse(is_duplicate=False, similarity=0.0)
