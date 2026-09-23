"""
TradeAI Forecast Engine Facade (Backward Compatibility)
Delegates to backend.agents.forecast_engine.ForecastEngine
"""
from backend.agents.forecast_engine import ForecastEngine

__all__ = ["ForecastEngine"]
