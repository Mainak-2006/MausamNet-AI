from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "mausamnet-ml"}


def test_classify_placeholder():
    response = client.post("/classify/", json={"text": "Heavy rain in Delhi"})
    assert response.status_code == 200
    body = response.json()
    assert "event_type" in body
    assert "confidence" in body


def test_credibility_placeholder():
    response = client.post(
        "/credibility/", json={"text": "Heavy rain", "source": "citizen"}
    )
    assert response.status_code == 200
    assert "score" in response.json()


def test_duplicates_placeholder():
    response = client.post("/duplicates/", json={"text": "Heavy rain"})
    assert response.status_code == 200
    assert "is_duplicate" in response.json()


def test_preprocess_placeholder():
    response = client.post("/preprocess/", json={"text": "Heavy rain"})
    assert response.status_code == 200
    assert "tokens" in response.json()
