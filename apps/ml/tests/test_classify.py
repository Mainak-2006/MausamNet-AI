from app.services.classify import classify


def test_classify_returns_known_keys():
    result = classify("Heavy rainfall in Delhi")
    assert "event_type" in result
    assert "confidence" in result
    assert "probabilities" in result


def test_classify_empty_text_returns_other():
    result = classify("")
    assert result["event_type"] == "other"
    assert result["confidence"] == 0.0


def test_classify_blank_text_returns_other():
    result = classify("   ")
    assert result["event_type"] == "other"


def test_classify_returns_valid_event_type():
    result = classify("Severe flooding in low lying areas, water entered homes")
    assert result["event_type"] in {
        "rainfall",
        "flood",
        "thunderstorm",
        "heatwave",
        "strong_wind",
        "cyclone",
        "drought",
        "other",
    }


def test_classify_probabilities_are_normalised_floats():
    result = classify("Cyclone made landfall bringing torrential rain")
    assert isinstance(result["confidence"], float)
    for value in result["probabilities"].values():
        assert isinstance(value, float)
        assert 0.0 <= value <= 1.0


def test_classify_hindi_rainfall():
    result = classify("दिल्ली में भारी बारिश हुई और सड़कें गीली हो गईं")
    assert result["event_type"] == "rainfall"


def test_classify_bengali_flood():
    result = classify("নিচু এলাকায় বন্যা দেখা দিয়েছে")
    assert result["event_type"] == "flood"


def test_classify_tamil_rainfall():
    result = classify("சென்னையில் கனமழை பெய்தது")
    assert result["event_type"] == "rainfall"


def test_classify_urdu_rainfall():
    result = classify("دہلی میں تیز بارش ہوئی")
    assert result["event_type"] == "rainfall"


def test_classify_hindi_heatwave():
    result = classify("भीषण गर्मी पड़ रही है")
    assert result["event_type"] == "heatwave"


def test_classify_multilingual_other():
    result = classify("शुक्रवार को शहर में मेला लगेगा")
    assert result["event_type"] == "other"
