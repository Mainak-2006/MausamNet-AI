"""Credibility scoring service for weather reports.

Computes a 0-100 credibility score from textual quality, source reliability,
media presence, location validity and text formality. Weights are configurable
and exposed in the returned factors dictionary.
"""

from __future__ import annotations

from typing import Any

from app.services.transliterate import to_latin

_SOURCE_WEIGHTS: dict[str, float] = {
    "imd": 25.0,
    "openweather": 22.0,
    "govt": 25.0,
    "official": 24.0,
    "citizen": 18.0,
    "social": 12.0,
    "news": 20.0,
}

# Words and patterns that increase perceived text quality / formality.
_DETAIL_INDICATORS: list[str] = [
    "degree", "km", "kph", "kmph", "litre", "meter", "metre", "hour", "day",
    "night", "morning", "evening", "north", "south", "east", "west", "area",
    "region", "district", "street", "road", "colony", "village",
    # transliterated (Hindi/Urdu/Bengali/Tamil/Telugu)
    "darja", "digri", "kilometer", "ghanta", "din", "subah", "sham", "raat",
    "ilaaka", "jila", "gaon", "sadak", "sarrak", "bokke", "nagar", "shahar",
    "urus", "gram", "kelavu", "pradesham",
]

_FORMAL_INDICATORS: list[str] = [
    "confirmed", "reported", "observed", "measured", "according", "authorities",
    "department", "officials", "estimated", "recorded", "advisory", "warning",
    "alert", "evacuat", "rescu", "deploy",
    # transliterated
    "adhikari", "vibhag", "sarkar", "vibhag", "pustak", "rajya", "samachar",
    "kendra", "shatak", "suchna", "chhetra", "dipartment", "vilatham",
    "arivippu", "alart", "evaku", "raksha",
]


def _text_length_factor(text: str) -> float:
    """Grade the amount of detail from the raw word count (0-25)."""
    words = len(text.split())
    if words >= 40:
        return 25.0
    if words >= 20:
        return 20.0
    if words >= 10:
        return 15.0
    if words >= 4:
        return 8.0
    return 3.0


def _detail_factor(text: str) -> float:
    """Reward reports that mention concrete quantitative details (0-25)."""
    lower = text.lower()
    hits = sum(1 for indicator in _DETAIL_INDICATORS if indicator in lower)
    return min(hits * 4.0, 25.0)


def _formality_factor(text: str) -> float:
    """Reward formal / corroborated language (0-15)."""
    lower = text.lower()
    hits = sum(1 for indicator in _FORMAL_INDICATORS if indicator in lower)
    return min(hits * 3.0, 15.0)


def _source_factor(source: str) -> float:
    """Grade source reliability (0-25)."""
    key = source.strip().lower()
    if not key:
        return 10.0
    return _SOURCE_WEIGHTS.get(key, 14.0)


def score_credibility(
    text: str,
    source: str,
    has_media: bool = False,
    has_location: bool = True,
) -> dict[str, Any]:
    """Compute a 0-100 credibility score with a factor breakdown.

    Returns a dict with ``score`` and ``factors`` keys.
    """
    roman = to_latin(text).lower()
    text_length = _text_length_factor(roman)
    detail = _detail_factor(roman)
    formality = _formality_factor(roman)
    source_score = _source_factor(source)
    media_score = 15.0 if has_media else 0.0
    location_score = 5.0 if has_location else 0.0

    total = (
        text_length + detail + formality + source_score + media_score + location_score
    )
    score = round(max(0.0, min(100.0, total)), 1)

    factors = {
        "text_length": round(text_length, 1),
        "text_detail": round(detail, 1),
        "text_formality": round(formality, 1),
        "source_reliability": round(source_score, 1),
        "has_media": media_score,
        "location_valid": location_score,
    }

    return {"score": score, "factors": factors}
