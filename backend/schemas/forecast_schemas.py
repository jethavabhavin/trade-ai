from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ForecastPoint(BaseModel):
    day: int  # 1 to 7
    date: str # "2026-09-22"
    day_name: str # "Tue", "Wed", etc.
    predicted_close: float
    upper_bound: float
    lower_bound: float
    confidence_pct: float
    trend: str # "UP", "DOWN", "FLAT"

class MorningSignal(BaseModel):
    id: str
    symbol: str
    name: str
    date: str # e.g. "2026-09-22"
    generated_at: str # e.g. "08:45 AM"
    action: str # "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL"
    current_price: float
    target_price: float
    stop_loss: float
    expected_roi_pct: float
    confidence: int # e.g. 88
    risk_level: str # "LOW" | "MEDIUM" | "HIGH"
    rationale: str
    technical_catalysts: List[str]
    sentiment_score: float # -1.0 to 1.0
    rsi: float
    macd_signal: str

class ComparisonBarPoint(BaseModel):
    time_label: str
    predicted_close: float
    actual_close: float
    lower_bound: float
    upper_bound: float
    variance_pct: float
    variance_amount: float
    within_confidence_band: bool

class PredictionComparisonResponse(BaseModel):
    symbol: str
    name: str
    currency: str = "₹"
    predicted_at: str
    predicted_base_price: float
    target_price: float
    stop_loss: float
    action: str
    confidence_score: float
    current_market_price: float
    price_delta: float
    price_delta_pct: float
    directional_accuracy_pct: float
    target_hit: bool
    stop_loss_triggered: bool
    status: str # "TARGET_HIT" | "ON_TRACK" | "ACCURATE_TRACKING" | "SL_TRIGGERED"
    model_name: str
    forecast_points: List[ForecastPoint] = []
    comparison_bars: List[ComparisonBarPoint] = []
    summary_text: str
