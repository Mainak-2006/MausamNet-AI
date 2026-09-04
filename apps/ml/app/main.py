from fastapi import FastAPI

from app.routers import classify, credibility, duplicates, preprocess

app = FastAPI(
    title="MausamNet-AI ML Service",
    description=(
        "Weather event classification, credibility scoring, and duplicate detection"
    ),
    version="0.1.0",
)

app.include_router(classify.router)
app.include_router(credibility.router)
app.include_router(duplicates.router)
app.include_router(preprocess.router)


@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "mausamnet-ml"}
