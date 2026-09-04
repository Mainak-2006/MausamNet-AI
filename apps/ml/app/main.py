import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import ALLOWED_ORIGINS
from app.routers import classify, credibility, duplicates, preprocess
from app.services import model_loader

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MausamNet-AI ML Service",
    description=(
        "Weather event classification, credibility scoring, "
        "and duplicate detection"
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router)
app.include_router(credibility.router)
app.include_router(duplicates.router)
app.include_router(preprocess.router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Return JSON for HTTP-level errors (404, 405, etc.)."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return a clean JSON body for pydantic validation errors."""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "error": "Validation Error"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a JSON error response for unhandled exceptions."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal error occurred while processing the request.",
            "error": type(exc).__name__,
        },
    )


@app.get("/health", tags=["health"])
async def health() -> dict[str, object]:
    """Health check endpoint reporting service and model status."""
    return {
        "status": "healthy",
        "model_loaded": model_loader.model_available(),
        "version": app.version,
    }
