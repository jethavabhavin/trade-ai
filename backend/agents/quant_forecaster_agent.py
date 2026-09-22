from typing import Dict, Any, List
try:
    from backend.agents.base_agent import BaseAgent, AgentResult
    from backend.timesfm_service import timesfm_service
    from backend.models import ForecastPoint
except ImportError:
    from agents.base_agent import BaseAgent, AgentResult
    from timesfm_service import timesfm_service
    from models import ForecastPoint

class QuantForecasterAgent(BaseAgent):
    """
    Quantitative Forecaster Agent:
    Executes Google TimesFM 3.0 PyTorch Foundation Model time-series forecasting,
    generating multi-day price trajectories and 10th-90th quantile probability channels.
    """
    def __init__(self):
        super().__init__(name="Quant Forecaster (TimesFM-3.0)")

    def run(self, state: Dict[str, Any]) -> AgentResult:
        symbol = state.get("symbol", "TATASIL")
        horizon = int(state.get("horizon", 7))
        horizon = max(3, min(horizon, 30)) # clamp between 3 and 30 days

        market_data = state.get("market_data", {})
        sentiment_data = state.get("sentiment_data", {})

        company_name = market_data.get("company_name", symbol)
        current_price = market_data.get("current_price", 100.0)
        history_closes = market_data.get("historical_closes", [current_price])
        covariate_factor = sentiment_data.get("timesfm_covariate_factor", 1.0)

        # Run TimesFM 3.0 Foundation Model inference
        prediction_result = timesfm_service.predict_future_horizon(
            symbol=symbol,
            name=company_name,
            current_price=current_price,
            historical_prices=history_closes,
            horizon=horizon
        )

        forecast_points = prediction_result.get("forecast_points", [])
        end_price = prediction_result.get("predicted_end_price", current_price)
        predicted_roi = prediction_result.get("predicted_roi_pct", 0.0)
        confidence_score = prediction_result.get("confidence_score", 90.0)
        quantiles = prediction_result.get("quantiles_summary", {})
        q10 = quantiles.get("q10_lower_bound", current_price * 0.95)
        q90 = quantiles.get("q90_upper_bound", current_price * 1.05)

        summary = (
            f"TimesFM 3.0 completed {horizon}-step autoregressive forecast on {prediction_result.get('device', 'CPU')}. "
            f"Point Forecast: {market_data.get('currency', '₹')}{end_price:.2f} ({predicted_roi:+.2f}% ROI) | "
            f"10th-90th Quantile Channel: [{q10:.2f} ➔ {q90:.2f}] | Confidence: {confidence_score:.1f}%."
        )

        return AgentResult(
            agent_name=self.name,
            status="SUCCESS",
            summary=summary,
            data={
                "model_name": prediction_result.get("model", "Google TimesFM 3.0 (google/timesfm-3.0-pytorch)"),
                "device": prediction_result.get("device", "CPU"),
                "inference_time_ms": prediction_result.get("inference_time_ms", 120.0),
                "forecast_horizon": horizon,
                "current_price": current_price,
                "predicted_end_price": end_price,
                "predicted_roi_pct": predicted_roi,
                "confidence_score": confidence_score,
                "quantiles_summary": quantiles,
                "forecast_points": forecast_points,
                "neural_reasoning": prediction_result.get("neural_reasoning", "")
            }
        )
