from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class PricePoint(BaseModel):
    timestamp: str  # ISO string or date
    time_label: str # e.g. "09:15", "Mon", "Oct 24", "2023"
    open: float
    high: float
    low: float
    close: float
    volume: int

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

class StockSummary(BaseModel):
    symbol: str
    name: str
    category: str # "ETF", "EQUITY", "INDEX", "CRYPTO"
    exchange: str # "NSE", "BSE", "NASDAQ"
    current_price: float
    change_amount: float
    change_pct: float
    currency: str
    volume_24h: str
    market_cap: str
    sparkline: List[float]
    morning_signal: Optional[MorningSignal] = None
    previous_close: Optional[float] = None
    today_open: Optional[float] = None

class StockDetail(StockSummary):
    description: str
    week_high_52: float
    week_low_52: float
    day_high: float
    day_low: float
    pe_ratio: Optional[float] = None
    historical_data: Dict[str, List[PricePoint]] = Field(default_factory=dict) # keys: "1D", "1W", "1M", "1Y", "5Y"
    forecast_next_week: List[ForecastPoint] = Field(default_factory=list)
    forecast_1d: List[ForecastPoint] = Field(default_factory=list)

class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str = "user" # "user", "admin"
    is_active: bool = True
    avatar_url: Optional[str] = None
    risk_tolerance: str = "MODERATE" # "CONSERVATIVE", "MODERATE", "AGGRESSIVE"
    morning_alert_time: str = "08:30 AM"
    enable_push_notifications: bool = True
    watchlist: List[str] = Field(default_factory=list)

class WishlistItemResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    name: str
    category: str = "EQUITY"
    target_buy_price: Optional[float] = None
    notes: Optional[str] = ""
    added_at: str
    current_price: Optional[float] = None
    change_amount: Optional[float] = None
    change_pct: Optional[float] = None
    currency: Optional[str] = "₹"
    morning_signal_action: Optional[str] = None
    morning_signal_confidence: Optional[float] = None
    morning_signal_target: Optional[float] = None

class WishlistAddRequest(BaseModel):
    symbol: str
    name: Optional[str] = None
    category: Optional[str] = "EQUITY"
    target_buy_price: Optional[float] = None
    notes: Optional[str] = None

class WishlistUpdateRequest(BaseModel):
    target_buy_price: Optional[float] = None
    notes: Optional[str] = None

class PineScriptGenerateRequest(BaseModel):
    symbol: str
    name: Optional[str] = None
    preset: Optional[str] = "TIMESFM_NEURAL_BANDS" # "TIMESFM_NEURAL_BANDS", "PREMARKET_MOMENTUM", "SUPER_TREND_VOLATILITY", "MULTI_AGENT_FUSION", "AI_BREAKOUT_SCALPER"
    script_type: Optional[str] = "STRATEGY" # "STRATEGY" or "INDICATOR"
    timeframe: Optional[str] = "15m" # "1m", "5m", "15m", "1h", "1D"
    initial_capital: Optional[float] = 100000.0
    stop_loss_pct: Optional[float] = 2.5
    take_profit_pct: Optional[float] = 6.0
    custom_inputs: Optional[Dict[str, Any]] = None

class PineScriptSaveRequest(BaseModel):
    title: str
    symbol: str
    code: str
    script_type: Optional[str] = "STRATEGY"
    strategy_preset: Optional[str] = "TIMESFM_NEURAL_BANDS"
    timeframe: Optional[str] = "15m"
    pine_version: Optional[str] = "v5"
    description: Optional[str] = None
    inputs: Optional[Dict[str, Any]] = None
    backtest_stats: Optional[Dict[str, Any]] = None

class PineScriptResponse(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    title: str
    symbol: str
    script_type: str
    strategy_preset: str
    timeframe: str
    pine_version: str = "v5"
    code: str
    description: Optional[str] = ""
    inputs: Dict[str, Any] = Field(default_factory=dict)
    backtest_stats: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = ""
    updated_at: Optional[str] = ""

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserSignupRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: Optional[str] = "user"

class AuthResponse(BaseModel):
    token: str
    user: UserProfile

class PortfolioPosition(BaseModel):
    id: str
    symbol: str
    name: str
    shares: float
    average_buy_price: float
    current_price: float
    invested_amount: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    buy_date: str

class PortfolioSummary(BaseModel):
    total_invested: float
    total_current_value: float
    total_pnl: float
    total_pnl_pct: float
    positions: List[PortfolioPosition]

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

# Admin Schemas
class AdminUserItem(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    risk_tolerance: str
    watchlist_count: int
    portfolio_balance: float
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None

class AdminUserCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "user" # "user" or "admin"
    is_active: bool = True
    risk_tolerance: str = "MODERATE"

class AdminRoleUpdateRequest(BaseModel):
    role: str # "user" or "admin"

class AdminStatusUpdateRequest(BaseModel):
    is_active: bool

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    total_trades: int
    total_positions: int
    system_status: str
    database_dialect: str
    timesfm_model_status: str

class AuditLogItem(BaseModel):
    id: int
    user_id: Optional[str]
    username: Optional[str]
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    created_at: str

# Multi-Agent Pipeline Schemas (TimesFM 3.0 + Gemini)
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

# Pine Script Studio Schemas
class PineScriptGenerateRequest(BaseModel):
    symbol: str
    name: Optional[str] = None
    strategy_preset: Optional[str] = None
    preset: Optional[str] = None
    script_type: Optional[str] = "strategy"
    timeframe: Optional[str] = "15m"
    pine_version: Optional[str] = "v5"
    initial_capital: Optional[float] = 100000.0
    stop_loss_pct: Optional[float] = 2.5
    take_profit_pct: Optional[float] = 6.0
    inputs: Optional[Dict[str, Any]] = None
    custom_inputs: Optional[Dict[str, Any]] = None

class PineScriptSaveRequest(BaseModel):
    title: str
    symbol: str
    script_type: str = "strategy"
    strategy_preset: str = "TIMESFM_NEURAL_BANDS"
    timeframe: str = "15m"
    pine_version: Optional[str] = "v5"
    code: str
    description: Optional[str] = None
    inputs: Optional[Dict[str, Any]] = None
    backtest_stats: Optional[Dict[str, Any]] = None

class PineScriptUpdateRequest(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    timeframe: Optional[str] = None
    pine_version: Optional[str] = None
    inputs: Optional[Dict[str, Any]] = None
    backtest_stats: Optional[Dict[str, Any]] = None

class PineScriptResponse(BaseModel):
    id: Optional[str] = None
    title: str
    symbol: str
    script_type: str
    strategy_preset: str
    timeframe: str
    pine_version: str
    code: str
    description: Optional[str] = None
    inputs: Dict[str, Any] = {}
    backtest_stats: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
