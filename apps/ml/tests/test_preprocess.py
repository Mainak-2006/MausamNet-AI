from app.services.preprocess import clean, preprocess, remove_stopwords, tokenize
from data.training_data import EVENT_TYPES


def test_clean_lowercases_and_strips_punctuation():
    assert clean("  Heavy RAIN, in DELHI!  ") == "heavy rain in delhi"


def test_tokenize_splits_into_words():
    assert tokenize("Heavy rain in Delhi") == ["heavy", "rain", "in", "delhi"]


def test_remove_stopwords_filters_common_words():
    tokens = ["heavy", "rain", "in", "delhi", "the"]
    assert remove_stopwords(tokens) == ["heavy", "rain", "delhi"]


def test_preprocess_returns_deduplicated_cleaned_tokens():
    result = preprocess("Heavy heavy rain in Delhi the city")
    assert result == ["heavy", "rain", "in", "delhi", "the", "city"]


def test_preprocess_removes_stopwords_when_requested():
    result = preprocess("Heavy heavy rain in Delhi the city", remove_stop=True)
    assert result == ["heavy", "rain", "delhi", "city"]


def test_event_types_are_valid():
    assert "rainfall" in EVENT_TYPES
    assert "flood" in EVENT_TYPES
    assert "thunderstorm" in EVENT_TYPES
    assert "heatwave" in EVENT_TYPES
    assert "strong_wind" in EVENT_TYPES
    assert "cyclone" in EVENT_TYPES
    assert "drought" in EVENT_TYPES
    assert "other" in EVENT_TYPES


def test_preprocess_hindi_returns_tokens():
    result = preprocess("दिल्ली में भारी बारिश हुई")
    assert len(result) > 0
    assert all(isinstance(token, str) and token.isascii() for token in result)


def test_preprocess_urdu_returns_tokens():
    result = preprocess("دہلی میں تیز بارش ہوئی")
    assert len(result) > 0
    assert all(token.isascii() for token in result)


def test_preprocess_bengali_returns_tokens():
    result = preprocess("ঢাকায় ভারী বৃষ্টি হয়েছে")
    assert len(result) > 0
