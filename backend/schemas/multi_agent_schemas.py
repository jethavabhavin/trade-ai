from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.schemas.forecast_schemas import ForecastPoint

class MultiAgentRequest(BaseModel):
    symbol: str
    horizon: int = Field(default=7, ge=3, le=30)
    risk_tolerance: Optional[str] = "MODERATE"

class AgentTraceItem(BaseModel):
    step: int
    agent_name: str
    status: str
    execution_time_ms: float
    summary: str
    error: Optional[str] = None

class MultiAgentFinalSignal(BaseModel):
    action: str
    target_price: float
    stop_loss: float
    expected_roi_pct: float
    confidence: int
    risk_level: str
    executive_summary: str
    technical_catalysts: List[str]
    sentiment_score: float
    sentiment_label: str

class MultiAgentAnalysisResponse(BaseModel):
    symbol: str
    name: str
    currency: str
    exchange: str
    current_price: float
    timestamp: str
    total_pipeline_time_ms: float
    final_signal: MultiAgentFinalSignal
    timesfm_forecast: Dict[str, Any]
    gemini_reasoning: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    agent_execution_traces: List[AgentTraceItem]

class TimesFMAnalysisResponse(BaseModel):
    symbol: str
    name: str
    model: str = "Google TimesFM 3.0 (google/timesfm-3.0-pytorch)"
    device: str
    context_length: int
    forecast_horizon: int
    inference_time_ms: float
    current_price: float
    predicted_end_price: float
    predicted_roi_pct: float
    confidence_score: float
    quantiles_summary: Dict[str, float]
    forecast_points: List[ForecastPoint]
    neural_reasoning: str
    sentiment_index: float
