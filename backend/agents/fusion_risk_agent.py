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
    computes final trade action, target price, stop-loss, calibrated confidence score,
    and applies risk guardrails (including TimesFM-3.0 licensing disclaimers).
    """
    def __init__(self):
        super().__init__(name="Fusion & Risk Agent (Gemini)")

    def run(self, state: Dict[str, Any]) -> AgentResult:
        symbol = state.get("symbol", "TATASIL")
        risk_tolerance = state.get("risk_tolerance", "MODERATE").upper()
        
        market_data = state.get("market_data", {})
        sentiment_data = state.get("sentiment_data", {})
        quant_data = state.get("quant_data", {})
        reasoning_data = state.get("reasoning_data", {})

        current_price = market_data.get("current_price", 100.0)
        predicted_end = quant_data.get("predicted_end_price", current_price)
        predicted_roi = quant_data.get("predicted_roi_pct", 0.0)
        quantiles = quant_data.get("quantiles_summary", {})
        raw_confidence = quant_data.get("confidence_score", 85.0)
        
        sentiment_score = sentiment_data.get("sentiment_score", 0.5)
        alignment_status = reasoning_data.get("alignment_status", "ALIGNED_BULLISH")
        volatility_pct = market_data.get("technical_indicators", {}).get("volatility_pct", 2.0)

        # 1. Calibrate Target Price and Stop Loss
        q10_support = quantiles.get("q10_lower_bound", current_price * 0.96)
        q90_resistance = quantiles.get("q90_upper_bound", current_price * 1.06)

        # Multi-factor signal synthesis
        combined_score = (predicted_roi * 0.55) + (sentiment_score * 8.0)
        
        if combined_score >= 6.0:
            action = "STRONG BUY"
            target_price = round(max(predicted_end, q90_resistance), 2)
            stop_loss = round(min(q10_support, current_price * 0.965), 2)
            risk_level = "LOW" if risk_tolerance == "CONSERVATIVE" else "MEDIUM"
        elif combined_score >= 2.0:
            action = "BUY"
            target_price = round(predicted_end, 2)
            stop_loss = round(min(q10_support, current_price * 0.96), 2)
            risk_level = "LOW"
        elif combined_score <= -4.0:
            action = "STRONG SELL"
            target_price = round(min(predicted_end, q10_support), 2)
            stop_loss = round(max(q90_resistance, current_price * 1.035), 2)
            risk_level = "HIGH"
        elif combined_score <= -1.5:
            action = "SELL"
            target_price = round(predicted_end, 2)
            stop_loss = round(max(q90_resistance, current_price * 1.03), 2)
            risk_level = "MEDIUM"
        else:
            action = "HOLD"
            target_price = round(current_price * 1.02, 2)
            stop_loss = round(current_price * 0.97, 2)
            risk_level = "LOW"

        expected_roi_pct = round(((target_price - current_price) / current_price) * 100.0, 2)
        
        # Apply Risk Guardrails to Confidence
        calibrated_confidence = int(min(94, max(60, raw_confidence + (5 if alignment_status.startswith("ALIGNED") else -10))))
        
        risk_flags = []
        if volatility_pct > 3.5:
            risk_flags.append(f"Elevated Asset Volatility ({volatility_pct}% 20-day standard deviation)")
        if not alignment_status.startswith("ALIGNED"):
            risk_flags.append("Divergence between quantitative trajectory and sentiment indicators")
        
        # License notification guardrail from plan
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
                    "combined_score": round(combined_score, 2)
                }
            }
        )
