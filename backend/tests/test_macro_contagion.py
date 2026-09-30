import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app
from services.macro_feed_service import collect_dynamic_live_payload
from agents.macro_contagion_agent import MacroContagionAgent
from agents.orchestrator_agent import orchestrator
from auth_utils import init_db_and_seed

init_db_and_seed()
client = TestClient(app)

def test_dynamic_live_payload_collection():
    """Verify that dynamic live payload collects all required dimensions without static assumptions."""
    payload = collect_dynamic_live_payload("HDFCBANK")
    assert payload["symbol"] == "HDFCBANK"
    assert "payload_timestamp_utc" in payload
    assert payload["exchange"] == "NSE"
    assert payload["currency"] == "₹"
    assert isinstance(payload["current_price"], (int, float))
    assert isinstance(payload["live_sector_peers_data"], list)
    assert len(payload["live_sector_peers_data"]) > 0
    # Clean feed defaults to empty list (zero speculation guarantee)
    assert payload["live_regulatory_and_fraud_feed"] == []
    assert payload["live_geopolitical_events"] == []
    assert isinstance(payload["brent_crude_price"], (int, float))
    assert isinstance(payload["usd_inr_rate"], (int, float))
    assert isinstance(payload["dxy_index"], (int, float))

def test_macro_agent_zero_hallucination_clean_feeds():
    """Verify that clean feeds strictly produce zero fraud citations and zero speculative war threats."""
    agent = MacroContagionAgent()
    state = {
        "symbol": "TCS",
        "market_data": {
            "symbol": "TCS",
            "company_name": "Tata Consultancy Services",
            "current_price": 3950.0,
            "currency": "₹",
            "exchange": "NSE"
        },
        "live_regulatory_and_fraud_feed": [],
        "live_geopolitical_events": []
    }
    result = agent.execute(state)
    assert result.status == "SUCCESS"
    data = result.data

    risk_audit = data["evidence_based_risk_audit"]
    gov = risk_audit["governance_and_fraud_assessment"]
    geo = risk_audit["geopolitical_and_crude_pressure"]
    quant = data["quantitative_adjustments"]

    # Factual grounding verification
    assert gov["active_infractions_found"] is False
    assert "NO_ACTIVE_REGULATORY_FLAGS_FOUND" in gov["verified_evidence_citations"]
    assert gov["governance_threat_level"] == "NONE"
    assert geo["threat_level"] == "NEGLIGIBLE"
    assert geo["chokepoint_disruption_active"] is False
    assert quant["trade_veto_activated"] is False

def test_macro_agent_trade_veto_on_severe_fraud():
    """Verify that verified regulatory fraud citations activate trade veto and supersede trade signals."""
    agent = MacroContagionAgent()
    state = {
        "symbol": "XYZCORP",
        "market_data": {
            "symbol": "XYZCORP",
            "company_name": "XYZ Corp",
            "current_price": 120.0,
            "currency": "₹",
            "exchange": "NSE"
        },
        "live_regulatory_and_fraud_feed": [
            {
                "title": "SEBI Order WTM/2026/09: Forensic Audit confirms accounting fraud and forensic raid",
                "authority": "SEBI",
                "severity": "CRITICAL"
            }
        ]
    }
    result = agent.execute(state)
    assert result.status == "SUCCESS"
    data = result.data

    gov = data["evidence_based_risk_audit"]["governance_and_fraud_assessment"]
    quant = data["quantitative_adjustments"]
    summary = data["final_audit_summary"]

    assert gov["active_infractions_found"] is True
    assert gov["governance_threat_level"] == "SEVERE_CRISIS"
    assert quant["trade_veto_activated"] is True
    assert "accounting fraud" in quant["veto_justification"].lower()
    assert summary["executive_verdict"] == "AVOID_SYSTEMIC_RISK"

def test_missing_data_protocol():
    """Verify that absent metrics are logged as unverified dimensions and penalized."""
    agent = MacroContagionAgent()
    state = {
        "symbol": "UNKNOWNASSET",
        "market_data": {
            "symbol": "UNKNOWNASSET",
            "current_price": 50.0,
            "market_cap": None
        },
        "quant_data": {},
        "target_state": {
            "supply_chain_index_value": "DATA_UNAVAILABLE"
        }
    }
    result = agent.execute(state)
    assert result.status == "SUCCESS"
    data = result.data
    integrity = data["data_integrity_audit"]
    assert "market_cap" in integrity["unverified_or_missing_dimensions"]

def test_macro_contagion_api_endpoint():
    """Verify GET /api/forecast/{symbol}/macro-contagion-audit endpoint."""
    res = client.get("/api/forecast/TATASIL/macro-contagion-audit")
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "TATASIL"
    assert "data_integrity_audit" in data
    assert "evidence_based_risk_audit" in data
    assert "quantitative_adjustments" in data
    assert "final_audit_summary" in data

def test_seven_agent_pipeline_execution():
    """Verify full 7-agent pipeline execution including macro contagion audit and trace logging."""
    state = {
        "symbol": "TATASIL",
        "horizon": 7,
        "risk_tolerance": "MODERATE"
    }
    result = orchestrator.execute(state)
    assert result.status == "SUCCESS"
    data = result.data

    # Check that 7 traces were recorded
    traces = data["agent_execution_traces"]
    assert len(traces) == 7
    macro_trace = next((t for t in traces if "Macro" in t["agent_name"]), None)
    assert macro_trace is not None
    assert macro_trace["status"] == "SUCCESS"

    # Check output packet contents
    assert "macro_contagion_audit" in data
    macro_audit = data["macro_contagion_audit"]
    assert "evidence_based_risk_audit" in macro_audit
    assert "quantitative_adjustments" in macro_audit
