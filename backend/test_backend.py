import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from auth_utils import init_db_and_seed

# Initialize DB and seed
init_db_and_seed()
client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online"
    assert data["auth"] == "JWT Bearer Active"

def test_unauthenticated_requests_rejected():
    """Verify that all core endpoints reject unauthenticated requests with 401 or 403."""
    res_stocks = client.get("/api/stocks")
    assert res_stocks.status_code in [401, 403]

    res_forecast = client.get("/api/forecast/morning-signals")
    assert res_forecast.status_code in [401, 403]

    res_portfolio = client.get("/api/portfolio")
    assert res_portfolio.status_code in [401, 403]

    res_admin = client.get("/api/admin/users")
    assert res_admin.status_code in [401, 403]

    res_multi_agent = client.get("/api/forecast/TATASIL/multi-agent-analysis")
    assert res_multi_agent.status_code in [401, 403]

def test_user_login_and_protected_access():
    # Login as trader
    login_res = client.post("/api/auth/login", json={
        "email": "trader@tradeai.app",
        "password": "TraderPassword@123"
    })
    assert login_res.status_code == 200
    auth_data = login_res.json()
    token = auth_data["token"]
    assert len(token) > 20
    assert auth_data["user"]["role"] == "user"

    headers = {"Authorization": f"Bearer {token}"}

    # Access stocks with token
    stocks_res = client.get("/api/stocks", headers=headers)
    assert stocks_res.status_code == 200
    stocks = stocks_res.json()
    assert len(stocks) > 0
    symbols = [s["symbol"] for s in stocks]
    assert "TATASIL" in symbols

    # Access stock detail
    detail_res = client.get("/api/stocks/TATASIL", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["symbol"] == "TATASIL"

    # Access morning signals
    signals_res = client.get("/api/forecast/morning-signals", headers=headers)
    assert signals_res.status_code == 200
    assert len(signals_res.json()) > 0

    # Access TimesFM forecast
    timesfm_res = client.get("/api/forecast/TATASIL/timesfm-predict", headers=headers)
    assert timesfm_res.status_code == 200
    assert "Google TimesFM 3.0" in timesfm_res.json()["model"]

    # Access portfolio
    port_res = client.get("/api/portfolio", headers=headers)
    assert port_res.status_code == 200

    # Verify user CANNOT access admin panel (403 Forbidden)
    admin_res = client.get("/api/admin/users", headers=headers)
    assert admin_res.status_code == 403
    assert "Admin privilege required" in admin_res.json()["detail"]

    # Test Token Refresh
    refresh_res = client.post("/api/auth/refresh", headers=headers)
    assert refresh_res.status_code == 200
    new_token = refresh_res.json()["token"]
    assert len(new_token) > 20

    # Test Logout
    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "success"

def test_admin_rbac_and_management():
    # Login as admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@tradeai.app",
        "password": "AdminPassword@123"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Get admin stats
    stats_res = client.get("/api/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_users"] >= 2
    assert stats["admin_users"] >= 1

    # List all users
    users_res = client.get("/api/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 2

    # Check audit logs
    audit_res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0

def test_signup_flow():
    import uuid
    rand_name = f"user_{uuid.uuid4().hex[:6]}"
    signup_res = client.post("/api/auth/signup", json={
        "username": rand_name,
        "email": f"{rand_name}@tradeai.app",
        "password": "SecurePassword@123",
        "full_name": "Test Trader"
    })
    assert signup_res.status_code == 200
    data = signup_res.json()
    assert data["user"]["username"] == rand_name
    assert "token" in data

def test_multi_agent_pipeline():
    # Login as trader
    login_res = client.post("/api/auth/login", json={
        "email": "trader@tradeai.app",
        "password": "TraderPassword@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Execute Multi-Agent Analysis
    res = client.post(
        "/api/forecast/multi-agent-analyze",
        json={"symbol": "TATASIL", "horizon": 7, "risk_tolerance": "AGGRESSIVE"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "TATASIL"
    assert "final_signal" in data
    assert data["final_signal"]["action"] in ["STRONG BUY", "BUY", "HOLD", "SELL", "STRONG SELL"]
    assert "timesfm_forecast" in data
    assert len(data["timesfm_forecast"]["forecast_points"]) == 7
    assert "gemini_reasoning" in data
    assert "agent_execution_traces" in data
    assert len(data["agent_execution_traces"]) == 6 # All 6 agents executed
