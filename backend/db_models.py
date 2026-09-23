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

