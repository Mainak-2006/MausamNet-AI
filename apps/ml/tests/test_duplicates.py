from app.services.duplicates import detect_duplicates


def test_empty_existing_returns_not_duplicate():
    result = detect_duplicates("Heavy rain", [])
    assert result["is_duplicate"] is False
    assert result["duplicate_of"] is None


def test_identical_texts_detected_as_duplicates():
    text = "Heavy rain in Delhi today"
    result = detect_duplicates(text, [text])
    assert result["is_duplicate"] is True
    assert result["duplicate_of"] == text


def test_similar_texts_detected_with_high_threshold():
    a = "Flooding reported in low lying areas of the city"
    b = "Flooding reported in low lying areas of the city today"
    result = detect_duplicates(a, [b], threshold=0.6)
    assert result["is_duplicate"] is True


def test_unrelated_texts_not_duplicates():
    result = detect_duplicates(
        "Heavy rainfall in Delhi", ["Job fair announced at the community hall"]
    )
    assert result["is_duplicate"] is False


def test_returns_best_match_index():
    texts = ["Clear skies expected today", "Severe flooding in the valley"]
    result = detect_duplicates(
        "Flooding in the valley is severe", texts, threshold=0.5
    )
    assert result["similar_to_index"] == 1
