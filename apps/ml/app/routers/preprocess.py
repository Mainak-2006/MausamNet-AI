from fastapi import APIRouter
from pydantic import BaseModel

from app.services.preprocess import preprocess

router = APIRouter(prefix="/preprocess", tags=["preprocess"])


class TextInput(BaseModel):
    text: str


class PreprocessResponse(BaseModel):
    tokens: list[str]


@router.post("/", response_model=PreprocessResponse)
async def preprocess_text(input: TextInput) -> dict[str, list[str]]:
    """Preprocess weather report text into cleaned tokens."""
    return {"tokens": preprocess(input.text)}
