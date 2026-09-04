from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/credibility", tags=["credibility"])


class CredibilityInput(BaseModel):
    text: str
    source: str
    has_media: bool = False
    has_location: bool = True


class CredibilityResponse(BaseModel):
    score: float
    factors: dict


@router.post("/", response_model=CredibilityResponse)
async def score_credibility(input: CredibilityInput):
    """Score the credibility of a weather report (placeholder)."""
    return CredibilityResponse(score=0.0, factors={})
