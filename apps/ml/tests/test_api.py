from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_classify_endpoint():
    response = client.post("/classify/", json={"text": "Heavy rain in Delhi"})
    assert response.status_code == 200
    body = response.json()
    assert "event_type" in body
    assert "confidence" in body
    assert isinstance(body["confidence"], float)


def test_classify_endpoint_validation_error():
    response = client.post("/classify/", json={})
    assert response.status_code == 422


def test_credibility_endpoint():
    response = client.post(
        "/credibility/",
        json={"text": "Heavy rain report", "source": "citizen", "has_media": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert "score" in body
    assert "factors" in body


def test_duplicates_endpoint():
    response = client.post(
        "/duplicates/",
        json={
            "text": "Flooding in low lying areas",
            "existing_texts": ["Flooding in low lying areas of the city"],
        },
    )
    assert response.status_code == 200
    assert "is_duplicate" in response.json()
    assert "similarity_score" in response.json()


def test_preprocess_endpoint():
    response = client.post("/preprocess/", json={"text": "Heavy rain in Delhi"})
    assert response.status_code == 200
    assert "tokens" in response.json()
    assert isinstance(response.json()["tokens"], list)


def test_unknown_route_returns_json_404():
    response = client.get("/does-not-exist")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_classify_hindi_over_api():
    response = client.post("/classify/", json={"text": "दिल्ली में भारी बारिश हुई"})
    assert response.status_code == 200
    assert response.json()["event_type"] == "rainfall"


def test_classify_urdu_over_api():
    response = client.post("/classify/", json={"text": "دہلی میں تیز بارش ہوئی"})
    assert response.status_code == 200
    assert response.json()["event_type"] == "rainfall"


def test_duplicates_bengali_over_api():
    response = client.post(
        "/duplicates/",
        json={
            "text": "নিচু এলাকায় বন্যা দেখা দিয়েছে",
            "existing_texts": ["নিচু এলাকায় বন্যা দেখা দিয়েছে"],
        },
    )
    assert response.status_code == 200
    assert response.json()["is_duplicate"] is True


def test_credibility_urdu_over_api():
    response = client.post(
        "/credibility/",
        json={"text": "دہلی میں تیز بارش ہوئی", "source": "citizen"},
    )
    assert response.status_code == 200
    assert 0.0 <= response.json()["score"] <= 100.0
