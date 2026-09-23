"""
TradeAI TimesFM Foundation Model Service Facade (Backward Compatibility)
Delegates to backend.agents.timesfm_service
"""
from backend.agents.timesfm_service import TimesFMService, timesfm_service

__all__ = ["TimesFMService", "timesfm_service"]
