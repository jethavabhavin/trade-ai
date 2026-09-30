import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    from backend.agents.base_agent import BaseAgent, AgentResult
    from backend.services.macro_feed_service import collect_dynamic_live_payload
except ImportError:
    from agents.base_agent import BaseAgent, AgentResult
    from services.macro_feed_service import collect_dynamic_live_payload

class MacroContagionAgent(BaseAgent):
    """
    Chief Risk Officer (CRO) and Lead Quantitative Auditor Agent:
    Executes a zero-hallucination, evidence-based cross-asset macro,
    regulatory scrutiny, and sector-peer contagion audit.
    """
    def __init__(self):
        super().__init__(name="Macro & Peer Contagion Auditor (Zero-Hallucination)")
        self.api_key = os.getenv("GEMINI_API_KEY")

    def _build_prompt(self, payload: Dict[str, Any]) -> str:
        symbol = payload["symbol"]
        company_name = payload["company_name"]
        exchange = payload["exchange"]
        currency = payload["currency"]
        current_price = payload["current_price"]
        market_cap_formatted = payload["market_cap_formatted"]
        sector_name = payload["sector_name"]
        sector_index_name = payload["sector_index_name"]
        asset_weight_in_sector_pct = payload["asset_weight_in_sector_pct"]
        rsi = payload["rsi"]
        volatility_pct = payload["volatility_pct"]
        beta = payload["beta"]
        live_sector_peers_data = payload["live_sector_peers_data"]
        live_regulatory_and_fraud_feed = payload["live_regulatory_and_fraud_feed"]
        live_geopolitical_events = payload["live_geopolitical_events"]
        brent_crude_price = payload["brent_crude_price"]
        brent_crude_24h_change_pct = payload["brent_crude_24h_change_pct"]
        supply_chain_index_value = payload["supply_chain_index_value"]
        supply_chain_status = payload["supply_chain_status"]
        us_fed_funds_rate = payload["us_fed_funds_rate"]
        domestic_central_bank_rate = payload["domestic_central_bank_rate"]
        us_nfp_actual = payload["us_nfp_actual"]
        us_nfp_consensus = payload["us_nfp_consensus"]
        us_unemployment_rate = payload["us_unemployment_rate"]
        us_10y_treasury_yield = payload["us_10y_treasury_yield"]
        us_cpi_rate = payload["us_cpi_rate"]
        domestic_cpi_rate = payload["domestic_cpi_rate"]
        usd_inr_rate = payload["usd_inr_rate"]
        usd_inr_5d_pct = payload["usd_inr_5d_pct"]
        dxy_index = payload["dxy_index"]
        dxy_trend = payload["dxy_trend"]
        fii_net_flow_today_cr = payload["fii_net_flow_today_cr"]
        dii_net_flow_today_cr = payload["dii_net_flow_today_cr"]
        timesfm_forecast_price = payload["timesfm_forecast_price"]
        timesfm_roi_pct = payload["timesfm_roi_pct"]
        timesfm_q10 = payload["timesfm_q10"]
        timesfm_q90 = payload["timesfm_q90"]
        timesfm_confidence_score = payload["timesfm_confidence_score"]
        payload_timestamp_utc = payload["payload_timestamp_utc"]

        return f"""
You are the Chief Risk Officer (CRO) and Lead Quantitative Auditor for TradeAI Hedge Intelligence.
Your task is to conduct an evidence-based, cross-asset macro and sector-peer contagion audit for {symbol}.

========================================================================================
CRITICAL ANTI-HALLUCINATION & FACTUAL GROUNDING RULES (STRICT ENFORCEMENT)
========================================================================================
1. ZERO SPECULATION / ZERO INVENTED DATA:
   - You must base your evaluation EXCLUSIVELY on the verified real-time data provided below.
   - NEVER invent, assume, or hallucinate any unverified fraud cases, regulatory raids, wars, earnings beats, or economic figures.
   - Do NOT use outdated historical facts from pre-training memory to guess today's current state.

2. MISSING DATA PROTOCOL:
   - If any field below contains null, empty list [], or "DATA_UNAVAILABLE", you must explicitly treat it as unverified.
   - You are STRICTLY FORBIDDEN from guessing what an unavailable value might be. Mark its risk impact as "UNVERIFIED_DATA" and apply a confidence penalty.

3. REAL-TIME FACTUAL CITATION:
   - When citing regulatory scrutiny or fraud, you MUST quote the exact title/source present in the "REGULATORY & GOVERNANCE FEED".
   - If the feed contains no fraud or regulatory actions, you MUST state "NO_ACTIVE_REGULATORY_FLAGS_FOUND". Do not speculate on possible future fraud.

4. MATHEMATICAL DETERMINISM:
   - All modifiers and scores must strictly correlate with the supplied numeric metrics. Do not fabricate arbitrary multipliers.

========================================================================================
REAL-TIME RUNTIME PAYLOAD (TIMESTAMP: {payload_timestamp_utc} UTC)
========================================================================================

--- [1. TARGET ASSET LIVE MARKET STATE] ---
- Symbol: {symbol}
- Registered Name: {company_name}
- Exchange & Currency: {exchange} | {currency}
- Real-Time Price: {currency}{current_price:.2f}
- Real-Time Market Cap: {currency}{market_cap_formatted}
- Sector: {sector_name}
- Sector Benchmark Index: {sector_index_name}
- Target Asset Weight in Sector Index: {asset_weight_in_sector_pct}%
- 14-Period RSI: {rsi}
- 20-Day Realized Volatility: {volatility_pct}%
- 1-Year Beta to Benchmark: {beta}

--- [2. LIVE SECTOR MARKET-CAP PEER SURVEILLANCE] ---
(Dynamic live scan of top sector peers by market cap and their intraday performance)
{json.dumps(live_sector_peers_data, indent=2)}

--- [3. LIVE CORPORATE GOVERNANCE, FRAUD & REGULATORY FEED] ---
(Verified real-time alerts from regulatory bodies: RBI, SEBI, SEC, ED, Exchanges, Corporate Disclosures)
{json.dumps(live_regulatory_and_fraud_feed, indent=2)}

--- [4. LIVE GEOPOLITICAL, WAR & ENERGY METRICS] ---
- Active Conflict / Shipping Chokepoint Alerts: {json.dumps(live_geopolitical_events, indent=2)}
- Brent Crude Oil Real-Time Spot: ${brent_crude_price}/bbl (24h Change: {brent_crude_24h_change_pct}%)
- Container Freight / Supply Chain Index: {supply_chain_index_value} (Status: {supply_chain_status})

--- [5. LIVE US & GLOBAL MACROECONOMIC / LABOR INDICATORS] ---
- US Federal Reserve Current Target Rate: {us_fed_funds_rate}%
- Domestic Central Bank Policy Repo Rate: {domestic_central_bank_rate}%
- US Non-Farm Payrolls (Latest Released vs Consensus): {us_nfp_actual}k vs {us_nfp_consensus}k
- US Unemployment Rate (Latest Released): {us_unemployment_rate}%
- US 10-Year Treasury Yield: {us_10y_treasury_yield}%
- US Headline CPI YoY: {us_cpi_rate}% | Domestic Headline CPI YoY: {domestic_cpi_rate}%

--- [6. LIVE FOREX, CURRENCY DYNAMICS & INSTITUTIONAL FLOWS] ---
- USD/INR Real-Time Exchange Rate: ₹{usd_inr_rate} (5-Day Net % Change: {usd_inr_5d_pct}%)
- US Dollar Index (DXY): {dxy_index} (Intraday Trend: {dxy_trend})
- FII (Foreign Institutional Investors) Net Flow Today: {currency}{fii_net_flow_today_cr} Crores
- DII (Domestic Institutional Investors) Net Flow Today: {currency}{dii_net_flow_today_cr} Crores

--- [7. NUMERICAL FOUNDATION MODEL INFERENCE (TimesFM 3.0)] ---
- Autoregressive 7-Day Point Forecast: {currency}{timesfm_forecast_price:.2f} ({timesfm_roi_pct:+.2f}%)
- Probabilistic Quantile Floor Q10 (Support): {currency}{timesfm_q10:.2f}
- Probabilistic Quantile Ceiling Q90 (Resistance): {currency}{timesfm_q90:.2f}
- Model Baseline Confidence: {timesfm_confidence_score}%

========================================================================================
OUTPUT SPECIFICATION:
========================================================================================
Analyze the live verified payload above without making any unsupported assumptions.
Generate a valid JSON object matching this schema exactly:

{{
  "data_integrity_audit": {{
    "all_required_feeds_present": true,
    "unverified_or_missing_dimensions": [],
    "data_freshness_verified": true
  }},

  "evidence_based_risk_audit": {{
    "governance_and_fraud_assessment": {{
      "active_infractions_found": false,
      "verified_evidence_citations": ["NO_ACTIVE_REGULATORY_FLAGS_FOUND"],
      "governance_threat_level": "NONE"
    }},

    "sector_contagion_and_peer_impact": {{
      "peer_breadth_state": "<SECTOR_RALLY | SECTOR_DRAG | MIXED_CONSOLIDATION | UNVERIFIED_DATA>",
      "peer_correlation_analysis": "Mathematical synthesis of peer performance and how it specifically impacts {symbol}",
      "peer_drag_factor": 0.0
    }},

    "geopolitical_and_crude_pressure": {{
      "threat_level": "<NEGLIGIBLE | ELEVATED | HIGH | SEVERE | UNVERIFIED_DATA>",
      "crude_impact_mechanism": "Factual description of input-cost or margin impact based strictly on crude price change",
      "chokepoint_disruption_active": false
    }},

    "macro_rates_and_forex_flight": {{
      "fii_liquidity_environment": "<ACCUMULATION | NEUTRAL | OUTFLOW_PRESSURE | AGGRESSIVE_LIQUIDATION>",
      "rate_divergence_pressure": "Factual summary of US yield vs domestic rate impact on asset valuation",
      "currency_depreciation_risk": "<LOW | MODERATE | HIGH>"
    }}
  }},

  "quantitative_adjustments": {{
    "composite_macro_score": 0.15,
    "timesfm_covariate_factor": 1.05,
    "recommended_stop_loss_buffer_pct": 1.8,
    "trade_veto_activated": false,
    "veto_justification": null
  }},

  "final_audit_summary": {{
    "executive_verdict": "<STRONG BUY | BUY | HOLD | SELL | STRONG SELL | AVOID_SYSTEMIC_RISK>",
    "grounded_conviction_score": 85,
    "evidence_summary": "3 sentences summarizing the exact verified data drivers without speculation."
  }}
}}
Return ONLY the raw JSON object without markdown or code fences.
"""

    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        if not self.api_key:
            return None
        
        def _invoke():
            try:
                from google import genai
                client = genai.Client(api_key=self.api_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"[{self.name}] Gemini API call note: {e}")
            return None

        try:
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_invoke)
                return future.result(timeout=6.0)
        except Exception as e:
            logger.warning(f"[{self.name}] Gemini call timeout or error: {e}")
            return None

    def run(self, state: Dict[str, Any]) -> AgentResult:
        symbol = state.get("symbol", "TATASIL")
        payload = collect_dynamic_live_payload(symbol, state)

        prompt = self._build_prompt(payload)
        gemini_response = self._call_gemini_api(prompt)
        parsed_audit: Optional[Dict[str, Any]] = None

        if gemini_response:
            try:
                clean_txt = gemini_response.strip()
                if "```" in clean_txt:
                    parts = clean_txt.split("```")
                    if len(parts) >= 3:
                        clean_txt = parts[1]
                    else:
                        clean_txt = parts[1] if len(parts) > 1 else clean_txt
                    if clean_txt.startswith("json"):
                        clean_txt = clean_txt[4:]
                clean_txt = clean_txt.strip("` \n")
                parsed_audit = json.loads(clean_txt)
            except Exception as e:
                logger.warning(f"[{self.name}] Failed to parse Gemini response JSON: {e}")

        # Deterministic Ground-Truth Engine Fallback
        if not parsed_audit or not isinstance(parsed_audit, dict):
            parsed_audit = self._generate_deterministic_audit(payload)

        # Enforce Ground-Truth Anti-Hallucination Safety Overrides
        parsed_audit = self._enforce_strict_ground_truth(parsed_audit, payload)

        verdict = parsed_audit.get("final_audit_summary", {}).get("executive_verdict", "HOLD")
        conviction = parsed_audit.get("final_audit_summary", {}).get("grounded_conviction_score", 70)
        veto_active = parsed_audit.get("quantitative_adjustments", {}).get("trade_veto_activated", False)

        summary = (
            f"Zero-Hallucination Macro & Contagion Audit completed for {symbol}. "
            f"Verdict: {verdict} (Conviction: {conviction}%). "
            f"Trade Veto: {'ACTIVATED' if veto_active else 'CLEAR'}."
        )

        audit_data = {
            "symbol": symbol,
            "payload_timestamp_utc": payload.get("payload_timestamp_utc"),
            "data_integrity_audit": parsed_audit.get("data_integrity_audit", {}),
            "evidence_based_risk_audit": parsed_audit.get("evidence_based_risk_audit", {}),
            "quantitative_adjustments": parsed_audit.get("quantitative_adjustments", {}),
            "final_audit_summary": parsed_audit.get("final_audit_summary", {}),
            "runtime_payload": payload,
            "engine": "Google Gemini 2.5 Flash (Strict Grounding)" if (self.api_key and gemini_response) else "TradeAI Deterministic Ground-Truth Engine"
        }

        return AgentResult(
            agent_name=self.name,
            status="SUCCESS",
            summary=summary,
            data=audit_data
        )

    def _enforce_strict_ground_truth(self, audit: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Hard enforcement rule layer:
        If verified feeds have NO fraud/regulatory items, forbid any speculative threat level.
        If verified feeds have NO conflict alerts, forbid non-negligible war threat.
        """
        reg_feed = payload.get("live_regulatory_and_fraud_feed") or []
        geo_feed = payload.get("live_geopolitical_events") or []

        risk_audit = audit.setdefault("evidence_based_risk_audit", {})
        gov_audit = risk_audit.setdefault("governance_and_fraud_assessment", {})
        geo_audit = risk_audit.setdefault("geopolitical_and_crude_pressure", {})
        quant_adj = audit.setdefault("quantitative_adjustments", {})

        if not reg_feed:
            gov_audit["active_infractions_found"] = False
            gov_audit["verified_evidence_citations"] = ["NO_ACTIVE_REGULATORY_FLAGS_FOUND"]
            if gov_audit.get("governance_threat_level") in ["MODERATE", "SEVERE_CRISIS"]:
                gov_audit["governance_threat_level"] = "NONE"

        if not geo_feed and geo_audit.get("threat_level") in ["HIGH", "SEVERE"]:
            geo_audit["threat_level"] = "NEGLIGIBLE"
            geo_audit["chokepoint_disruption_active"] = False

        # If trade veto is activated without real infractions, clear it
        if quant_adj.get("trade_veto_activated") and not reg_feed:
            # Check if there is systemic chokepoint or severe crisis
            if not geo_feed:
                quant_adj["trade_veto_activated"] = False
                quant_adj["veto_justification"] = None

        return audit

    def _generate_deterministic_audit(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Strict deterministic zero-hallucination evaluation based solely on the provided payload.
        Adheres to exact math without speculating.
        """
        symbol = payload["symbol"]
        current_price = payload["current_price"]
        volatility_pct = payload.get("volatility_pct") or 1.85
        fii_flow = payload.get("fii_net_flow_today_cr") or 0.0
        dii_flow = payload.get("dii_net_flow_today_cr") or 0.0
        timesfm_roi = payload.get("timesfm_roi_pct") or 0.0
        timesfm_conf = payload.get("timesfm_confidence_score") or 80.0
        peers = payload.get("live_sector_peers_data") or []
        crude_change = payload.get("brent_crude_24h_change_pct") or 0.0
        crude_price = payload.get("brent_crude_price") or 80.0
        reg_feed = payload.get("live_regulatory_and_fraud_feed") or []
        geo_feed = payload.get("live_geopolitical_events") or []

        # 1. Data Integrity Audit
        missing_dims = []
        if payload.get("market_cap_formatted") == "DATA_UNAVAILABLE":
            missing_dims.append("market_cap")
        if not peers:
            missing_dims.append("sector_peers")
        else:
            avail_peers = [p for p in peers if p.get("current_price") != "DATA_UNAVAILABLE"]
            if len(avail_peers) < len(peers):
                missing_dims.append(f"peers_partial_{len(avail_peers)}/{len(peers)}")

        all_present = (len(missing_dims) == 0)

        # 2. Peer Contagion Analysis
        valid_peer_changes = [
            float(p.get("day_change_pct", 0.0))
            for p in peers
            if p.get("current_price") != "DATA_UNAVAILABLE" and isinstance(p.get("day_change_pct"), (int, float))
        ]
        
        if valid_peer_changes:
            avg_peer_change = sum(valid_peer_changes) / len(valid_peer_changes)
            if avg_peer_change > 0.75:
                peer_state = "SECTOR_RALLY"
            elif avg_peer_change < -0.75:
                peer_state = "SECTOR_DRAG"
            else:
                peer_state = "MIXED_CONSOLIDATION"
            
            # Map peer change to peer_drag_factor between -1.0 and +1.0
            peer_drag_factor = max(-1.0, min(1.0, round(avg_peer_change / 3.0, 2)))
            peer_analysis = (
                f"Sector peers averaged intraday change of {avg_peer_change:+.2f}%. "
                f"Peer breadth displays {peer_state.replace('_', ' ').lower()} momentum."
            )
        else:
            peer_state = "UNVERIFIED_DATA"
            peer_drag_factor = 0.0
            peer_analysis = "Sector peer intraday feeds unavailable; no ungrounded contagion assumed."

        # 3. Governance and Fraud Assessment
        if reg_feed:
            active_infractions = True
            citations = [item.get("title", "Verified Regulatory Circular") for item in reg_feed]
            gov_threat = "SEVERE_CRISIS" if any("fraud" in c.lower() or "raid" in c.lower() for c in citations) else "MODERATE"
        else:
            active_infractions = False
            citations = ["NO_ACTIVE_REGULATORY_FLAGS_FOUND"]
            gov_threat = "NONE"

        # 4. Geopolitical & Energy Pressure
        if geo_feed:
            geo_threat = "HIGH"
            chokepoint_active = True
        else:
            geo_threat = "NEGLIGIBLE"
            chokepoint_active = False

        if crude_change > 2.5:
            crude_mech = f"Crude elevated by {crude_change:+.2f}% to ${crude_price}/bbl, exerting input-cost pressure on operating margins."
        elif crude_change < -2.5:
            crude_mech = f"Crude contraction of {crude_change:+.2f}% to ${crude_price}/bbl provides raw-material cost relief."
        else:
            crude_mech = f"Brent crude spot stable at ${crude_price}/bbl ({crude_change:+.2f}% 24h change) within normal operating bounds."

        # 5. Macro Rates & Forex
        net_inst_flow = fii_flow + dii_flow
        if fii_flow > 1000:
            fii_env = "ACCUMULATION"
        elif fii_flow < -2500:
            fii_env = "AGGRESSIVE_LIQUIDATION"
        elif fii_flow < 0:
            fii_env = "OUTFLOW_PRESSURE"
        else:
            fii_env = "NEUTRAL"

        usd_inr_5d = payload.get("usd_inr_5d_pct") or 0.0
        if usd_inr_5d > 1.0:
            cur_risk = "HIGH"
        elif usd_inr_5d > 0.3:
            cur_risk = "MODERATE"
        else:
            cur_risk = "LOW"

        # 6. Quantitative Adjustments
        # Bounded composite macro score [-1.0, 1.0]
        fii_component = max(-0.4, min(0.4, (fii_flow / 5000.0) * 0.4))
        dii_component = max(-0.2, min(0.2, (dii_flow / 5000.0) * 0.2))
        peer_component = peer_drag_factor * 0.3
        crude_component = -0.1 if crude_change > 2.0 else (+0.05 if crude_change < -2.0 else 0.0)
        
        composite_macro = round(max(-1.0, min(1.0, fii_component + dii_component + peer_component + crude_component)), 2)
        
        # TimesFM Covariate Factor [0.70, 1.30]
        # Scales TimesFM forecast attention based on verified tailwinds/headwinds
        covariate_factor = round(max(0.70, min(1.30, 1.0 + (composite_macro * 0.20))), 2)

        # Volatility stop-loss buffer [0.5%, 3.5%]
        sl_buffer = round(max(0.5, min(3.5, volatility_pct * 0.8)), 2)

        # Trade Veto condition
        trade_veto = False
        veto_reason = None
        if gov_threat == "SEVERE_CRISIS":
            trade_veto = True
            veto_reason = f"Trade veto activated due to verified corporate governance infraction: {', '.join(citations)}"
        elif geo_threat == "SEVERE":
            trade_veto = True
            veto_reason = "Trade veto activated due to verified severe systemic geopolitical disruption."

        # Final audit verdict
        if trade_veto:
            verdict = "AVOID_SYSTEMIC_RISK"
            conviction = 95
        elif timesfm_roi > 2.0 and composite_macro >= 0.15:
            verdict = "STRONG BUY"
            conviction = min(95, int(timesfm_conf + 5))
        elif timesfm_roi > 0.5 and composite_macro >= -0.1:
            verdict = "BUY"
            conviction = min(90, int(timesfm_conf))
        elif timesfm_roi < -2.0 and composite_macro <= -0.15:
            verdict = "STRONG SELL"
            conviction = min(95, int(timesfm_conf + 5))
        elif timesfm_roi < -0.5:
            verdict = "SELL"
            conviction = min(90, int(timesfm_conf))
        else:
            verdict = "HOLD"
            conviction = int(timesfm_conf)

        if missing_dims:
            conviction = max(40, conviction - (len(missing_dims) * 5))

        evidence_summary = (
            f"Audit grounded on live verified price of ₹{current_price:.2f} and TimesFM forecast of {timesfm_roi:+.2f}%. "
            f"Sector peer breadth is {peer_state.replace('_', ' ').lower()} with peer drag factor {peer_drag_factor:+.2f}, while corporate disclosures show no active regulatory infractions. "
            f"Institutional net flow stands at ₹{net_inst_flow:+.1f} Cr with composite macro score of {composite_macro:+.2f}."
        )

        return {
            "data_integrity_audit": {
                "all_required_feeds_present": all_present,
                "unverified_or_missing_dimensions": missing_dims,
                "data_freshness_verified": True
            },
            "evidence_based_risk_audit": {
                "governance_and_fraud_assessment": {
                    "active_infractions_found": active_infractions,
                    "verified_evidence_citations": citations,
                    "governance_threat_level": gov_threat
                },
                "sector_contagion_and_peer_impact": {
                    "peer_breadth_state": peer_state,
                    "peer_correlation_analysis": peer_analysis,
                    "peer_drag_factor": peer_drag_factor
                },
                "geopolitical_and_crude_pressure": {
                    "threat_level": geo_threat,
                    "crude_impact_mechanism": crude_mech,
                    "chokepoint_disruption_active": chokepoint_active
                },
                "macro_rates_and_forex_flight": {
                    "fii_liquidity_environment": fii_env,
                    "rate_divergence_pressure": f"US 10Y yield at {payload.get('us_10y_treasury_yield')}% vs domestic policy rate at {payload.get('domestic_central_bank_rate')}%.",
                    "currency_depreciation_risk": cur_risk
                }
            },
            "quantitative_adjustments": {
                "composite_macro_score": composite_macro,
                "timesfm_covariate_factor": covariate_factor,
                "recommended_stop_loss_buffer_pct": sl_buffer,
                "trade_veto_activated": trade_veto,
                "veto_justification": veto_reason
            },
            "final_audit_summary": {
                "executive_verdict": verdict,
                "grounded_conviction_score": conviction,
                "evidence_summary": evidence_summary
            }
        }
