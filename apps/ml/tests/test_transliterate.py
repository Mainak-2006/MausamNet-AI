from app.services.transliterate import to_latin


def test_hindi_transliterates_to_latin():
    out = to_latin("दिल्ली में भारी बारिश हुई")
    assert "barisa" in out or "barish" in out
    assert not any("\u0900" <= ch <= "\u097F" for ch in out)


def test_bengali_transliterates_to_latin():
    out = to_latin("ঢাকায় ভারী বৃষ্টি হয়েছে")
    assert not any("\u0980" <= ch <= "\u09FF" for ch in out)


def test_tamil_transliterates_to_latin():
    out = to_latin("சென்னையில் கனமழை பெய்தது")
    assert not any("\u0B80" <= ch <= "\u0BFF" for ch in out)


def test_telugu_transliterates_to_latin():
    out = to_latin("హైదరాబాద్లో భారీ వర్షం")
    assert not any("\u0C00" <= ch <= "\u0C7F" for ch in out)


def test_urdu_uses_roman_word_map():
    # "بارش" -> barish
    out = to_latin("بارش")
    assert out.lower() in {"barish"}


def test_urdu_word_map_for_city():
    out = to_latin("دہلی")
    assert out.lower() == "dilli"


def test_english_passes_through():
    out = to_latin("Heavy rain in Delhi")
    assert out == "Heavy rain in Delhi"


def test_empty_passes_through():
    assert to_latin("") == ""
