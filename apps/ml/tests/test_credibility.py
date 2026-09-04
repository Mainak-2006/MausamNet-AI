from app.services.credibility import score_credibility


def test_score_within_range():
    result = score_credibility(
        "Heavy rain in the city, water entered homes", source="citizen"
    )
    assert 0.0 <= result["score"] <= 100.0


def test_score_returns_factors():
    result = score_credibility(
        "Heavy rain", source="citizen", has_media=True, has_location=True
    )
    assert "factors" in result
    assert "text_length" in result["factors"]
    assert "source_reliability" in result["factors"]
    assert "has_media" in result["factors"]
    assert "location_valid" in result["factors"]


def test_media_and_location_increase_score():
    base = score_credibility("Detailed weather report", source="citizen")
    enhanced = score_credibility(
        "Detailed weather report", source="citizen", has_media=True, has_location=False
    )
    assert enhanced["score"] > base["score"]


def test_imd_source_scores_higher_than_social():
    imd = score_credibility("Heavy rain report with warnings", source="imd")
    social = score_credibility("Heavy rain report with warnings", source="social")
    assert imd["score"] > social["score"]


def test_longer_detailed_text_scores_higher():
    short = score_credibility("Rain", source="citizen")
    long = score_credibility(
        "Heavy rain measured 12 cm in three hours across the northern "
        "district, confirmed by local authorities and officials.",
        source="citizen",
    )
    assert long["score"] > short["score"]
