import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "2.0.0"

def test_get_complaints():
    response = client.get("/api/complaints?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 5

def test_get_summary():
    response = client.get("/api/complaints/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_complaints" in data
    assert "open_complaints" in data

def test_get_traffic():
    response = client.get("/api/traffic")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "congestion_level" in data[0]

def test_get_benchmark():
    response = client.get("/api/benchmark")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
