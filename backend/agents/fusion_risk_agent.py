import math
from typing import Dict, Any, List
try:
    from backend.agents.base_agent import BaseAgent, AgentResult
except ImportError:
    from agents.base_agent import BaseAgent, AgentResult

class FusionRiskAgent(BaseAgent):
    """
    Fusion & Risk Agent:
    Reconciles numeric time-series quantiles with qualitative Gemini reasoning,
    zero-hallucination macro and sector-peer contagion audits,
    computes final trade action, target price, stop-loss, calibrated confidence score,
    and applies risk guardrails (including TimesFM-3.0 licensing disclaimers & systemic trade vetoes).
    """
    def __init__(self):
        super().__init__(name="Fusion & Risk Agent (Gemini & Multi-Source Guardrails)")

    def run(self, state: Dict[str, Any]) -> AgentResult:
        symbol = state.get("symbol", "TATASIL")
        risk_tolerance = state.get("risk_tolerance", "MODERATE").upper()
        
        market_data = state.get("market_data", {})
        sentiment_data = state.get("sentiment_data", {})
        quant_data = state.get("quant_data", {})
        reasoning_data = state.get("reasoning_data", {})
        macro_data = state.get("macro_contagion_data", {})

        current_price = market_data.get("current_price", 100.0)
        predicted_end = quant_data.get("predicted_end_price", current_price)
        predicted_roi = quant_data.get("predicted_roi_pct", 0.0)
        quantiles = quant_data.get("quantiles_summary", {})
        raw_confidence = quant_data.get("confidence_score", 85.0)
        
        sentiment_score = sentiment_data.get("sentiment_score", 0.5)
        alignment_status = reasoning_data.get("alignment_status", "ALIGNED_BULLISH")
        volatility_pct = market_data.get("technical_indicators", {}).get("volatility_pct", 2.0)

        # 1. Parse Zero-Hallucination Macro & Contagion Audit Modifiers
        quant_adj = macro_data.get("quantitative_adjustments", {})
        risk_audit = macro_data.get("evidence_based_risk_audit", {})
        
        trade_veto_activated = quant_adj.get("trade_veto_activated", False)
        veto_justification = quant_adj.get("veto_justification")
        composite_macro_score = quant_adj.get("composite_macro_score", 0.0)
        timesfm_covariate_factor = quant_adj.get("timesfm_covariate_factor", 1.0)
        sl_buffer_pct = quant_adj.get("recommended_stop_loss_buffer_pct", 2.0)

        peer_contagion = risk_audit.get("sector_contagion_and_peer_impact", {})
        peer_drag_factor = peer_contagion.get("peer_drag_factor", 0.0)
        peer_breadth_state = peer_contagion.get("peer_breadth_state", "MIXED_CONSOLIDATION")

        gov_assessment = risk_audit.get("governance_and_fraud_assessment", {})
        gov_threat_level = gov_assessment.get("governance_threat_level", "NONE")

        # 2. Support & Resistance Bounds
        q10_support = quantiles.get("q10_lower_bound", current_price * 0.96)
        q90_resistance = quantiles.get("q90_upper_bound", current_price * 1.06)

        risk_flags: List[str] = []

        # 3. Check Systemic Trade Veto First
        if trade_veto_activated:
            action = "AVOID_SYSTEMIC_RISK"
            target_price = round(current_price, 2)
            stop_loss = round(current_price * (1.0 - (sl_buffer_pct / 100.0)), 2)
            risk_level = "CRITICAL"
            calibrated_confidence = 95
            risk_flags.append(f"TRADE VETO ACTIVATED: {veto_justification or 'Verified severe governance or systemic contagion threat.'}")
        else:
            # 4. Multi-factor signal synthesis with Macro & Peer Contagion covariates
            scaled_roi = predicted_roi * timesfm_covariate_factor
            combined_score = (
                (scaled_roi * 0.50) + 
                (sentiment_score * 6.0) + 
                (composite_macro_score * 4.0) + 
                (peer_drag_factor * 3.0)
            )

            # Volatility-adjusted stop-loss buffer calculation
            vol_sl_mult = max(0.94, 1.0 - (sl_buffer_pct / 100.0))

            if combined_score >= 5.5:
                action = "STRONG BUY"
                target_price = round(max(predicted_end, q90_resistance), 2)
                stop_loss = round(min(q10_support, current_price * vol_sl_mult), 2)
                risk_level = "LOW" if risk_tolerance == "CONSERVATIVE" else "MEDIUM"
            elif combined_score >= 1.5:
                action = "BUY"
                target_price = round(predicted_end, 2)
                stop_loss = round(min(q10_support, current_price * vol_sl_mult), 2)
                risk_level = "LOW"
            elif combined_score <= -4.0:
                action = "STRONG SELL"
                target_price = round(min(predicted_end, q10_support), 2)
                stop_loss = round(max(q90_resistance, current_price * (1.0 + (sl_buffer_pct / 100.0))), 2)
                risk_level = "HIGH"
            elif combined_score <= -1.2:
                action = "SELL"
                target_price = round(predicted_end, 2)
                stop_loss = round(max(q90_resistance, current_price * (1.0 + (sl_buffer_pct / 100.0))), 2)
                risk_level = "MEDIUM"
            else:
                action = "HOLD"
                target_price = round(current_price * 1.015, 2)
                stop_loss = round(current_price * vol_sl_mult, 2)
                risk_level = "LOW"

            # Apply Risk Guardrails to Confidence
            align_adj = 5 if alignment_status.startswith("ALIGNED") else -8
            macro_conf_adj = int(round(composite_macro_score * 5))
            calibrated_confidence = int(min(95, max(50, raw_confidence + align_adj + macro_conf_adj)))

        expected_roi_pct = round(((target_price - current_price) / current_price) * 100.0, 2) if current_price else 0.0

        # Additional Contextual Risk Flags
        if volatility_pct > 3.5:
            risk_flags.append(f"Elevated Asset Volatility ({volatility_pct}% 20-day standard deviation)")
        if not alignment_status.startswith("ALIGNED") and not trade_veto_activated:
            risk_flags.append("Divergence between quantitative trajectory and sentiment indicators")
        if peer_breadth_state == "SECTOR_DRAG":
            risk_flags.append(f"Negative Sector Contagion: Peers dragging benchmark with factor {peer_drag_factor:+.2f}")
        if gov_threat_level != "NONE" and not trade_veto_activated:
            risk_flags.append(f"Regulatory & Governance Alert: {gov_threat_level}")

        # TimesFM licensing notice
        licensing_notice = (
            "Google TimesFM-3.0 weights are licensed for research and non-commercial prototyping. "
            "For live production trading execution, ensure a commercial license or TimesFM-2.5 Apache-2.0 fallback."
        )
        risk_flags.append(f"Model Licensing: {licensing_notice}")

        summary = (
            f"Synthesized Multi-Agent Decision: {action} | Target: {market_data.get('currency', '₹')}{target_price:.2f} "
            f"({expected_roi_pct:+.2f}%) | Stop-Loss: {market_data.get('currency', '₹')}{stop_loss:.2f} | "
            f"Confidence: {calibrated_confidence}% | Risk Level: {risk_level}."
        )

        return AgentResult(
            agent_name=self.name,
            status="SUCCESS",
            summary=summary,
            data={
                "action": action,
                "target_price": target_price,
                "stop_loss": stop_loss,
                "expected_roi_pct": expected_roi_pct,
                "confidence": calibrated_confidence,
                "risk_level": risk_level,
                "risk_flags": risk_flags,
                "licensing_disclaimer": licensing_notice,
                "fused_metrics": {
                    "support_q10": q10_support,
                    "resistance_q90": q90_resistance,
                    "sentiment_score": sentiment_score,
                    "composite_macro_score": composite_macro_score,
                    "peer_drag_factor": peer_drag_factor,
                    "timesfm_covariate_factor": timesfm_covariate_factor,
                    "trade_veto_activated": trade_veto_activated,
                    "combined_score": round(combined_score if not trade_veto_activated else -99.0, 2)
                }
            }
        )
