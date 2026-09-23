from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from backend.schemas.forecast_schemas import MorningSignal, ForecastPoint

class PricePoint(BaseModel):
    timestamp: str  # ISO string or date
    time_label: str # e.g. "09:15", "Mon", "Oct 24", "2023"
    open: float
    high: float
    low: float
    close: float
    volume: int

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
