"""Transliteration layer that maps Indic scripts to plain ASCII (Roman).

Transliterating non-English weather reports to a common Latin feature space
allows a single shared classifier to handle Hindi, Bengali, Tamil, Telugu and
Assamese (via the lightweight ``indic-transliteration`` Sanscript engine) as
well as Urdu (via a curated Roman-Urdu word map).
"""

from __future__ import annotations

import re
import unicodedata

from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

# Script ranges used for lightweight language/script detection.
_DEVANAGARI = re.compile(r"[\u0900-\u097F]")
_BENGALI = re.compile(r"[\u0980-\u09FF]")
_TAMIL = re.compile(r"[\u0B80-\u0BFF]")
_TELUGU = re.compile(r"[\u0C00-\u0C7F]")
_GUJARATI = re.compile(r"[\u0A80-\u0AFF]")
_GURMUKHI = re.compile(r"[\u0A00-\u0A7F]")
_KANNADA = re.compile(r"[\u0C80-\u0CFF]")
_MALAYALAM = re.compile(r"[\u0D00-\u0D7F]")
_ORIYA = re.compile(r"[\u0B00-\u0B7F]")
_URDU = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")
_LATIN = re.compile(r"[A-Za-z]+")

# Map a detected character range to the Sanscript scheme used to transliterate.
_SCRIPT_SCHEMES: dict[re.Pattern[str], str] = {
    _DEVANAGARI: sanscript.DEVANAGARI,
    _BENGALI: sanscript.BENGALI,
    _TAMIL: sanscript.TAMIL,
    _TELUGU: sanscript.TELUGU,
    _GUJARATI: sanscript.GUJARATI,
    _GURMUKHI: sanscript.GURMUKHI,
    _KANNADA: sanscript.KANNADA,
    _MALAYALAM: sanscript.MALAYALAM,
    _ORIYA: sanscript.ORIYA,
}

# Roman-Urdu dictionary covering common weather and geography vocabulary.
_ROMAN_URDU: dict[str, str] = {
    # weather events
    "بارش": "barish",
    "باریش": "barish",
    "سیلاب": "sailab",
    "طوفان": "toofan",
    "گرمی": "garmi",
    "آندھی": "aandhi",
    "ہوا": "hawa",
    "ژکال": "zukam",
    # common words
    "میں": "mein",
    "ہوئی": "hui",
    "ہے": "hai",
    "کیا": "kia",
    "اور": "aur",
    "کا": "ka",
    "کی": "ki",
    "کے": "ke",
    "نہیں": "nahi",
    "بہت": "bahut",
    # cities / regions
    "دہلی": "dilli",
    "دلی": "dilli",
    "ممبئی": "mumbai",
    "چنئی": "chennai",
    "کولکتہ": "kolkata",
    "حیدرآباد": "hyderabad",
    "گواہاٹی": "guwahati",
    "ہندوستان": "hindustan",
    "بنگلہ": "bangla",
}

# Fallback character-level mapping for Urdu letters to Latin (approximate,
# sufficient for weather-domain vocabulary not present in the dictionary).
_URDU_CHAR_MAP: dict[str, str] = {
    "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ٹ": "t", "ث": "s", "ج": "j",
    "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ڈ": "d", "ذ": "z", "ر": "r",
    "ڑ": "r", "ز": "z", "ژ": "z", "س": "s", "ش": "sh", "ص": "s", "ض": "z",
    "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f", "ق": "q", "ک": "k",
    "گ": "g", "ل": "l", "م": "m", "ن": "n", "و": "w", "ہ": "h", "ھ": "h",
    "ء": "", "ی": "y", "ے": "e", "آ": "aa", "ؤ": "o", "ئ": "y", "ں": "n",
    "‍": "", "‌": "",
}


def _strip_ascii(text: str) -> str:
    """Remove combining diacritical marks, producing plain ASCII."""
    normalized = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return (stripped.replace("়", "").replace("ॺ", "").replace("ৱ", "")
            .replace("·", ""))


def _detect_scripts(text: str) -> list[re.Pattern[str]]:
    """Return the script patterns found in the text, in priority order."""
    found: list[re.Pattern[str]] = []
    for pattern in _SCRIPT_SCHEMES:
        if pattern.search(text):
            found.append(pattern)
    return found


def _transliterate_indic(text: str) -> str:
    """Transliterate Brahmic-script text to plain ASCII."""
    result = text
    for pattern in _detect_scripts(text):
        scheme = _SCRIPT_SCHEMES[pattern]
        roman = transliterate(text, scheme, sanscript.IAST)
        result = _strip_ascii(roman)
        break
    return result


def _transliterate_urdu(text: str) -> str:
    """Transliterate Urdu (Perso-Arabic) text to Roman using a word map.

    Whole known words are looked up first; any remaining Arabic-script
    characters fall back to a per-character Latin mapping.
    """
    words = str(text).split()
    transliterated_words: list[str] = []
    for word in words:
        mapped = _ROMAN_URDU.get(word)
        if mapped is None:
            mapped = "".join(_URDU_CHAR_MAP.get(ch, ch) for ch in word)
        if mapped:
            transliterated_words.append(mapped)
    return " ".join(transliterated_words)


def to_latin(text: str) -> str:
    """Convert text to a plain-ASCII Latin representation.

    English/Latin text passes through unchanged apart from normalization.
    Brahmic scripts are transliterated and Urdu is mapped to Roman.
    """
    if not text:
        return text

    normalized = unicodedata.normalize("NFC", text)
    if _URDU.search(normalized):
        return _transliterate_urdu(normalized)
    if _detect_scripts(normalized):
        return _transliterate_indic(normalized)
    return normalized
