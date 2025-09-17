import sys
import os
import time
import multiprocessing

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest


def run_backend():
    from backend.app import app

    app.run(port=5000, debug=False, use_reloader=False)


@pytest.fixture(scope="session", autouse=True)
def start_backend():
    proc = multiprocessing.Process(target=run_backend)
    proc.start()
    time.sleep(5)  # Give the server time to start
    yield
    proc.terminate()
    proc.join()


# Now import everything else
from bson import ObjectId
from pymongo import MongoClient
import requests
from backend.gcal import delete_all_events_from_calendar

# Test config
MONGO_URI = os.getenv("DATABASE_CONNECTION_STRING", "mongodb://localhost:27017/")
API_URL = "http://localhost:5000/api/reservations"
DB_NAME = os.getenv("DB_NAME")


@pytest.fixture(scope="session", autouse=True)
def start_backend():
    proc = multiprocessing.Process(target=run_backend)
    proc.start()
    time.sleep(5)  # Give the server time to start
    yield
    proc.terminate()
    proc.join()


@pytest.fixture(scope="function")
def mongo_client():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    yield db["reservations"]
    client.close()


@pytest.fixture(autouse=True, scope="function")
def clear_collection(mongo_client):
    mongo_client.delete_many({})
    delete_all_events_from_calendar()
    yield
    mongo_client.delete_many({})
    delete_all_events_from_calendar()


def test_single_reservation_per_day(mongo_client):
    payload = {
        "reserver": "Alice",
        "createdBy": "alice123",
        "startTime": "2025-09-18T14:00:00Z",
        "endTime": "2025-09-18T16:00:00Z",
    }
    r1 = requests.post(API_URL, json=payload)
    assert r1.status_code == 201
    r2 = requests.post(API_URL, json=payload)
    assert r2.status_code == 400
    assert "one reservation per day" in r2.text.lower()


def test_reservation_outside_valid_hours(mongo_client):
    payload = {
        "reserver": "Bob",
        "createdBy": "bob123",
        "startTime": "2025-09-19T07:00:00Z",  # 7am, invalid weekday
        "endTime": "2025-09-19T09:00:00Z",
    }
    r = requests.post(API_URL, json=payload)
    assert r.status_code == 400
    assert "allowed" in r.text.lower()


def test_create_and_delete_reservation(mongo_client):
    payload = {
        "reserver": "Charlie",
        "createdBy": "charlie123",
        "startTime": "2025-09-20T14:00:00Z",
        "endTime": "2025-09-20T16:00:00Z",
    }
    r = requests.post(API_URL, json=payload)
    assert r.status_code == 201
    res_id = r.json()["_id"]
    # Confirm in DB
    db_res = mongo_client.find_one({"_id": ObjectId(res_id)})
    assert db_res is not None
    # Delete
    del_r = requests.delete(f"{API_URL}/{res_id}")
    print(del_r)
    assert del_r.status_code == 200
    # Confirm deletion
    db_res = mongo_client.find_one({"_id": ObjectId(res_id)})
    assert db_res is None
