"""Duplicate report detection service.

Compares an incoming report description against a list of existing report
texts using TF-IDF + cosine similarity. Supports an optional absolute
similarity threshold.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from app.services.preprocess import preprocess

DEFAULT_THRESHOLD: float = 0.8


def _vectorizer() -> TfidfVectorizer:
    """Return a fresh character n-gram TF-IDF vectorizer.

    A fresh vectorizer is fit on each incoming corpus rather than reusing a
    shared/trained one, because duplicate comparison requires fitting on the
    documents being compared and must never mutate cached classifier state.
    """
    return TfidfVectorizer(lowercase=True, analyzer="char_wb", ngram_range=(2, 4))


def detect_duplicates(
    text: str,
    existing_texts: list[str],
    threshold: float = DEFAULT_THRESHOLD,
) -> dict[str, Any]:
    """Return the most similar existing report and a duplication verdict.

    Returns a dict with ``is_duplicate``, ``similar_to_index``,
    ``similarity_score`` and ``duplicate_of`` keys.
    """
    normalized_existing = [t or "" for t in existing_texts]

    if not text.strip() or not normalized_existing:
        return {
            "is_duplicate": False,
            "similar_to_index": None,
            "similarity_score": 0.0,
            "duplicate_of": None,
        }

    corpus = [" ".join(preprocess(t)) for t in normalized_existing + [text]]
    vectorizer = _vectorizer().fit(corpus)
    vectors = vectorizer.transform(corpus).toarray()

    new_vector = vectors[-1]
    existing_vectors = vectors[:-1]

    if len(existing_vectors) == 0:
        return {
            "is_duplicate": False,
            "similar_to_index": None,
            "similarity_score": 0.0,
            "duplicate_of": None,
        }

    similarities = []
    for vector in existing_vectors:
        denom = (np.linalg.norm(vector) * np.linalg.norm(new_vector)) or 1.0
        if vector.any() and new_vector.any():
            sim = float(np.dot(vector, new_vector) / denom)
        else:
            sim = 0.0
        similarities.append(round(sim, 4))

    best_index = int(np.argmax(similarities))
    best_score = similarities[best_index]

    return {
        "is_duplicate": best_score >= threshold,
        "similar_to_index": best_index,
        "similarity_score": best_score,
        "duplicate_of": (
            normalized_existing[best_index] if best_score >= threshold else None
        ),
    }
