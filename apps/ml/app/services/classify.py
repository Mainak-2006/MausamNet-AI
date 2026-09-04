"""Weather event text classification service.

Uses a trained scikit-learn pipeline (TF-IDF + linear classifier) to classify
free-text weather reports into one of the platform's event types. If no model
is available the classifier falls back to a keyword-based heuristic so the
service remains functional during development.
"""

from __future__ import annotations

from typing import Any

from app.services import model_loader
from app.services.preprocess import preprocess
from data.training_data import EVENT_TYPES

# Fallback keyword sets used when no trained model is present.
# Includes transliterated terms so the fallback works across languages.
_KEYWORD_MAP: dict[str, list[str]] = {
    "rainfall": [
        "rain", "rainfall", "drizzle", "shower", "downpour", "monsoon",
        "waterlog", "barish", "barisa", "varsam", "vrsti", "varasuna",
        "mazhai", "ghanamalai", "barsaat",
    ],
    "flood": [
        "flood", "flooding", "inundat", "submerg", "breach", "overflow",
        "sailab", "banya", "baan", "vellam", "vella",
    ],
    "thunderstorm": [
        "thunder", "lightning", "storm", "hail", "stormcloud", "bijli",
        "gurit", "idar", "minnal",
    ],
    "heatwave": [
        "heatwave", "heat", "scorch", "mercury", "temperature", "humid",
        "garmi", "garma", "ushna", "vekali",
    ],
    "strong_wind": [
        "wind", "gust", "squall", "velocity", "uproot", "hawa", "hava",
        "andhi", "gali", "kattu",
    ],
    "cyclone": [
        "cyclone", "cyclonic", "landfall", "tropical", "storm surge",
        "toofan", "chakravat", "puyal", "tufaan",
    ],
    "drought": [
        "drought", "deficit", "dryspe", "dry", "fail crop", "reservoir",
        "sukha", "khara", "varadhi", "karuvai",
    ],
}


def _keyword_fallback(text: str) -> tuple[str, float]:
    """Simple keyword matcher returning (event_type, confidence)."""
    tokens = " ".join(preprocess(text))
    best_type: str = "other"
    best_hits: int = 0
    for event_type, keywords in _KEYWORD_MAP.items():
        hits = sum(1 for keyword in keywords if keyword in tokens)
        if hits > best_hits:
            best_hits = hits
            best_type = event_type
    confidence = 0.5 + (0.2 * best_hits)
    return best_type, min(confidence, 0.95)


def _predict_with_model(text: str) -> tuple[str, float, dict[str, float]]:
    vectorizer = model_loader.load_vectorizer()
    classifier = model_loader.load_classifier()
    features_vector = vectorizer.transform([" ".join(preprocess(text))])
    probabilities = classifier.predict_proba(features_vector)[0]
    classes = [str(cls) for cls in classifier.classes_]
    probs = [float(p) for p in probabilities]
    prob_dict = {cls: round(prob, 4) for cls, prob in zip(classes, probs)}
    best_index = int(probs.index(max(probs)))
    best_type = classes[best_index]
    confidence = round(probs[best_index], 4)
    return best_type, confidence, prob_dict


def classify(text: str) -> dict[str, Any]:
    """Classify a weather report description.

    Returns a dict with ``event_type``, ``confidence`` and ``probabilities``.
    """
    if not text or not text.strip():
        return {
            "event_type": "other",
            "confidence": 0.0,
            "probabilities": {et: 0.0 for et in EVENT_TYPES},
        }

    if model_loader.model_available():
        try:
            event_type, confidence, probabilities = _predict_with_model(text)
            if event_type not in EVENT_TYPES:
                event_type = "other"
            return {
                "event_type": event_type,
                "confidence": confidence,
                "probabilities": probabilities,
            }
        except Exception:
            # Fall through to keyword heuristic if model errors at runtime.
            pass

    event_type, confidence = _keyword_fallback(text)
    probabilities = {et: 0.0 for et in EVENT_TYPES}
    probabilities[event_type] = confidence
    return {
        "event_type": event_type,
        "confidence": confidence,
        "probabilities": probabilities,
    }
