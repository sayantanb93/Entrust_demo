from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_healthcheck():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_printers_and_known_values():
    response = client.get("/api/printers")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert any(p["model"] == "CR805" and p["serial_number"] == "NM18312" for p in data["printers"])


def test_printer_details_have_versions():
    response = client.get("/api/printers/p-18312/details")
    assert response.status_code == 200
    assert any(name == "DPCL" for name, _ in response.json()["versions"])


def test_fallback_details_match_selected_printer():
    response = client.get("/api/printers/p-0ds2c/details")
    assert response.status_code == 200
    assert ["Serial Number", "CB630251"] in response.json()["product_data"]


def test_unknown_printer_returns_404():
    response = client.get("/api/printers/not-a-printer")
    assert response.status_code == 404
