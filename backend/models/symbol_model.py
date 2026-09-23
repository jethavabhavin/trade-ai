from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from backend.database import Base

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
