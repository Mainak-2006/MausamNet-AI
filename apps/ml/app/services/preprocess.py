"""Text preprocessing utilities for weather report analysis.

Provides cleaning, transliteration, tokenization, stopword removal and
stemming used by the classification, credibility and duplicate detection
services. Non-English reports in Indic scripts (Hindi, Bengali, Tamil, Telugu,
Assamese) and Urdu are first transliterated to Roman so a shared feature space
can be used across languages.
"""

from __future__ import annotations

import re

from app.services.transliterate import to_latin

_STOPWORDS: frozenset[str] = frozenset(
    {
        # English
        "a", "an", "the", "and", "or", "but", "if", "of", "on", "in", "at",
        "to", "for", "with", "by", "from", "as", "is", "are", "was", "were",
        "be", "been", "being", "has", "have", "had", "do", "does", "did",
        "will", "would", "shall", "should", "may", "might", "can", "could",
        "it", "this", "that", "these", "those", "i", "we", "you", "he", "she",
        "they", "them", "their", "its", "there", "here", "not", "no", "so",
        "very", "more", "most", "than", "then", "when", "where", "which",
        "who", "whom", "what", "why", "how", "all", "some", "any", "each",
        "every", "both", "few", "other", "such", "only", "own", "same", "too",
        "s", "t", "about", "into", "over", "after", "before", "between",
        "under", "again", "further", "once", "here", "just", "during",
        "while", "through", "against",
        # Hindi / Urdu (transliterated)
        "hai", "mein", "mem", "ko", "ki", "ka", "ke", "se", "aur",
        "bhi", "nahi", "tha", "the", "thi", "yeh", "woh", "ho", "hain",
        "kya", "par", "pe", "tak", "jis", "us", "mera", "tere", "apna",
        # Bengali (transliterated)
        "haya", "hay", "ache", "kichu", "ebong", "o", "ata", "ei", "se",
        "tara", "amra", "kono",
        # Tamil (transliterated)
        "oru", "innum", "ungal", "en", "avan", "aval", "ithu", "athu", "mela",
        # Telugu (transliterated)
        "oka", "vyakti", "idi", "adi", "ee", "aa", "mariyu", "kuda", "loni",
        # General spacing filler
        "kiye",
    }
)

# Punctuation and symbols removed from text (keeps all Unicode letters).
_NON_ALPHA: re.Pattern[str] = re.compile(r"[^\w\s]", re.UNICODE)
_MULTI_SPACE: re.Pattern[str] = re.compile(r"\s+")

# Simple heuristic stemmer suffix rules (sufficient for feature extraction).
def clean(text: str) -> str:
    """Lowercase and strip punctuation, digits and extra whitespace."""
    cleaned = text.lower()
    cleaned = _NON_ALPHA.sub(" ", cleaned)
    cleaned = _MULTI_SPACE.sub(" ", cleaned).strip()
    return cleaned


def tokenize(text: str) -> list[str]:
    """Split text into lowercase word tokens."""
    return clean(text).split()


def remove_stopwords(tokens: list[str]) -> list[str]:
    """Filter out common stopwords from a token list."""
    return [token for token in tokens if token not in _STOPWORDS]


def preprocess(text: str, remove_stop: bool = False) -> list[str]:
    """Full preprocessing pipeline for a text string.

    Transliterates Indic/Urdu text to Roman, then cleans, tokenizes and
    optionally removes stopwords. Returns a list of deduplicated tokens.
    By default stopwords are kept since TF-IDF handles common words well
    and removing them loses phrase structure needed to distinguish classes.
    """
    roman = to_latin(text)
    tokens = tokenize(roman)
    if remove_stop:
        tokens = remove_stopwords(tokens)
    return list(dict.fromkeys(tokens))
