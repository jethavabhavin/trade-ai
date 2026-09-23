import json
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text
from backend.database import Base

class TradeDataDB(Base):
    """
    Persistent repository for live trade quotes, OHLCV candle datasets, and fundamentals.
    Cached & reused locally to minimize redundant external exchange API calls.
    """
    __tablename__ = "trade_data"
    __table_args__ = {'extend_existing': True}

    symbol = Column(String(32), primary_key=True, index=True) # e.g. TATASIL, RELIANCE
    ticker = Column(String(64), nullable=False) # e.g. TATASTEEL.NS
    name = Column(String(128), nullable=False)
    category = Column(String(32), default="EQUITY")
    exchange = Column(String(32), default="NSE")
    currency = Column(String(8), default="₹")
    current_price = Column(Float, nullable=False)
    change_amount = Column(Float, default=0.0)
    change_pct = Column(Float, default=0.0)
    previous_close = Column(Float, default=0.0)
    today_open = Column(Float, default=0.0)
    day_high = Column(Float, default=0.0)
    day_low = Column(Float, default=0.0)
    week_high_52 = Column(Float, default=0.0)
    week_low_52 = Column(Float, default=0.0)
    volume_24h = Column(String(32), default="100K")
    market_cap = Column(String(32), default="₹100B")
    pe_ratio = Column(Float, default=24.5)
    description = Column(Text, nullable=True)
    historical_data_json = Column(Text, nullable=True, default="{}")
    sparkline_json = Column(Text, nullable=True, default="[]")
    source = Column(String(32), default="NSE")
    fetched_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def historical_data(self):
        try:
            return json.loads(self.historical_data_json or "{}")
        except Exception:
            return {}

    @historical_data.setter
    def historical_data(self, val):
        self.historical_data_json = json.dumps(val or {})

    @property
    def sparkline(self):
        try:
            return json.loads(self.sparkline_json or "[]")
        except Exception:
            return []

    @sparkline.setter
    def sparkline(self, val):
        self.sparkline_json = json.dumps(val or [])

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "ticker": self.ticker,
            "name": self.name,
            "category": self.category,
            "exchange": self.exchange,
            "currency": self.currency,
            "current_price": self.current_price,
            "change_amount": self.change_amount,
            "change_pct": self.change_pct,
            "previous_close": self.previous_close,
            "today_open": self.today_open,
            "day_high": self.day_high,
            "day_low": self.day_low,
            "week_high_52": self.week_high_52,
            "week_low_52": self.week_low_52,
            "volume_24h": self.volume_24h,
            "market_cap": self.market_cap,
            "pe_ratio": self.pe_ratio,
            "description": self.description or "",
            "historical_data": self.historical_data,
            "sparkline": self.sparkline,
            "source": self.source,
            "fetched_at": self.fetched_at.strftime("%Y-%m-%d %H:%M:%S") if self.fetched_at else "",
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else ""
        }
