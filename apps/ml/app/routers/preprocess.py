from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/preprocess", tags=["preprocess"])


class TextInput(BaseModel):
    text: str


class PreprocessResponse(BaseModel):
    tokens: list[str]


@router.post("/", response_model=PreprocessResponse)
async def preprocess_text(input: TextInput):
    """Preprocess weather report text (placeholder)."""
    return PreprocessResponse(tokens=[])
