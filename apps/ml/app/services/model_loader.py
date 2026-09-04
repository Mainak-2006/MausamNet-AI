"""Model registry: path resolution, model loading and caching.

The trained pickled artifacts (vectorizer + classifier) are stored in the
``models/`` directory and lazily loaded into a module-level cache the first
time they are requested.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib

logger = logging.getLogger(__name__)

MODEL_DIR: Path = Path(__file__).resolve().parents[2] / "models"

VECTORIZER_FILE: Path = MODEL_DIR / "vectorizer.joblib"
CLASSIFIER_FILE: Path = MODEL_DIR / "classifier.joblib"


def model_available() -> bool:
    """Return True if both trained model artifacts exist on disk."""
    return VECTORIZER_FILE.exists() and CLASSIFIER_FILE.exists()


@lru_cache(maxsize=1)
def load_vectorizer() -> Any:
    """Load (and cache) the TF-IDF vectorizer."""
    if not VECTORIZER_FILE.exists():
        raise FileNotFoundError(
            "Vectorizer not found. Run `python train.py` to train the model."
        )
    return joblib.load(VECTORIZER_FILE)


@lru_cache(maxsize=1)
def load_classifier() -> Any:
    """Load (and cache) the trained classifier."""
    if not CLASSIFIER_FILE.exists():
        raise FileNotFoundError(
            "Classifier not found. Run `python train.py` to train the model."
        )
    return joblib.load(CLASSIFIER_FILE)
