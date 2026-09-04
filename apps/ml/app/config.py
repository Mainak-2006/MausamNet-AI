"""Application configuration for the ML service.

Settings are read from environment variables with sensible defaults, mirroring
the backend's env variables where relevant.
"""

from __future__ import annotations

import os

# Comma-separated list of allowed origins for CORS.
ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv(
        "ML_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

# Threshold (0-1) past which two reports are considered duplicates.
DUPLICATE_THRESHOLD: float = float(os.getenv("ML_DUPLICATE_THRESHOLD", "0.8"))

# Whether to log the trained model version on startup.
LOG_MODEL_INFO: bool = os.getenv("ML_LOG_MODEL_INFO", "true").lower() in {
    "1",
    "true",
    "yes",
}
