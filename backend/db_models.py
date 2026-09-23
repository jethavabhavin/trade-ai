import json
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, DateTime, Text, Integer
try:
    from backend.database import Base
except ImportError:
    from database import Base

class UserDB(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default="user", index=True, nullable=False) # "user", "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(512), nullable=True)
    risk_tolerance = Column(String(32), default="MODERATE") # "CONSERVATIVE", "MODERATE", "AGGRESSIVE"
    morning_alert_time = Column(String(16), default="08:30 AM")
    enable_push_notifications = Column(Boolean, default=True)
    watchlist_json = Column(Text, default="[]")
    portfolio_balance = Column(Float, default=100000.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    @property
    def watchlist(self):
        try:
            return json.loads(self.watchlist_json or "[]")
        except Exception:
            return []

    @watchlist.setter
    def watchlist(self, val):
        self.watchlist_json = json.dumps(val or [])

    def to_profile_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "avatar_url": self.avatar_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "risk_tolerance": self.risk_tolerance,
            "morning_alert_time": self.morning_alert_time,
            "enable_push_notifications": self.enable_push_notifications,
            "watchlist": self.watchlist
        }


class AuditLogDB(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), index=True, nullable=True)
    username = Column(String(64), nullable=True)
    action = Column(String(64), nullable=False, index=True) # "LOGIN", "SIGNUP", "ROLE_CHANGE", "STATUS_TOGGLE", "TRADE", "DELETE_USER"
    details = Column(String(512), nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }


class MarketSymbolDB(Base):
    __tablename__ = "market_symbols"
    __table_args__ = {'extend_existing': True}

    symbol = Column(String(32), primary_key=True, index=True) # e.g. TATASIL, RELIANCE, AAPL
    ticker = Column(String(64), nullable=False) # e.g. TATASTEEL.NS, RELIANCE.NS, AAPL, ^NSEI
    name = Column(String(128), nullable=False)
    category = Column(String(32), default="EQUITY", nullable=False) # "EQUITY", "ETF", "INDEX"
    exchange = Column(String(32), default="NSE", nullable=False) # "NSE", "NASDAQ", "BSE"
    currency = Column(String(8), default="₹", nullable=False) # "₹", "$"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "ticker": self.ticker,
            "name": self.name,
            "category": self.category,
            "exchange": self.exchange,
            "currency": self.currency,
            "description": self.description or "",
            "is_active": self.is_active,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else ""
        }


class PredictionDB(Base):
    __tablename__ = "predictions"
    __table_args__ = {'extend_existing': True}

    id = Column(String(64), primary_key=True, index=True) # e.g. pred_tatasil_20260923_084500
    symbol = Column(String(32), index=True, nullable=False) # e.g. TATASIL
    name = Column(String(128), nullable=False)
    current_price = Column(Float, nullable=False)
    target_price = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    expected_roi_pct = Column(Float, nullable=False)
    action = Column(String(32), nullable=False, index=True) # STRONG BUY, BUY, HOLD, SELL, STRONG SELL
    confidence_score = Column(Float, nullable=False)
    risk_level = Column(String(32), default="MEDIUM") # LOW, MEDIUM, HIGH
    model_name = Column(String(128), default="TradeAI Multi-Horizon Neural Engine")
    horizon = Column(String(16), default="7D") # 1D, 7D
    forecast_1d_json = Column(Text, nullable=True, default="[]")
    forecast_7d_json = Column(Text, nullable=True, default="[]")
    technical_catalysts_json = Column(Text, nullable=True, default="[]")
    sentiment_score = Column(Float, default=0.0)
    rsi = Column(Float, default=50.0)
    macd_signal = Column(String(64), default="Neutral")
    rationale = Column(Text, nullable=True)
    predicted_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def forecast_1d(self):
        try:
            return json.loads(self.forecast_1d_json or "[]")
        except Exception:
            return []

    @forecast_1d.setter
    def forecast_1d(self, val):
        self.forecast_1d_json = json.dumps(val or [])

    @property
    def forecast_7d(self):
        try:
            return json.loads(self.forecast_7d_json or "[]")
        except Exception:
            return []

    @forecast_7d.setter
    def forecast_7d(self, val):
        self.forecast_7d_json = json.dumps(val or [])

    @property
    def technical_catalysts(self):
        try:
            return json.loads(self.technical_catalysts_json or "[]")
        except Exception:
            return []

    @technical_catalysts.setter
    def technical_catalysts(self, val):
        self.technical_catalysts_json = json.dumps(val or [])

    def to_dict(self):
        return {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "current_price": self.current_price,
            "target_price": self.target_price,
            "stop_loss": self.stop_loss,
            "expected_roi_pct": self.expected_roi_pct,
            "action": self.action,
            "confidence_score": self.confidence_score,
            "risk_level": self.risk_level,
            "model_name": self.model_name,
            "horizon": self.horizon,
            "forecast_1d": self.forecast_1d,
            "forecast_7d": self.forecast_7d,
            "technical_catalysts": self.technical_catalysts,
            "sentiment_score": self.sentiment_score,
            "rsi": self.rsi,
            "macd_signal": self.macd_signal,
            "rationale": self.rationale or "",
            "predicted_at": self.predicted_at.strftime("%Y-%m-%d %H:%M:%S") if self.predicted_at else "",
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else ""
        }


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



