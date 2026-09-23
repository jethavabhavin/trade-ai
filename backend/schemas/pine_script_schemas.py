from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class PineScriptGenerateRequest(BaseModel):
    symbol: str
    name: Optional[str] = None
    strategy_preset: Optional[str] = None
    preset: Optional[str] = "TIMESFM_NEURAL_BANDS"
    script_type: Optional[str] = "STRATEGY" # "STRATEGY" or "INDICATOR"
    timeframe: Optional[str] = "15m" # "1m", "5m", "15m", "1h", "1D"
    pine_version: Optional[str] = "v5"
    initial_capital: Optional[float] = 100000.0
    stop_loss_pct: Optional[float] = 2.5
    take_profit_pct: Optional[float] = 6.0
    inputs: Optional[Dict[str, Any]] = None
    custom_inputs: Optional[Dict[str, Any]] = None

class PineScriptSaveRequest(BaseModel):
    title: str
    symbol: str
    script_type: str = "STRATEGY"
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
