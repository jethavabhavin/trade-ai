import json
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from backend.database import Base

class PineScriptDB(Base):
    """
    Dedicated relational schema for generated and custom TradingView Pine Scripts.
    Stores Pine Script v5 code, strategy parameters, preset type, and simulated backtest metrics.
    """
    __tablename__ = "pine_scripts"
    __table_args__ = {'extend_existing': True}

    id = Column(String(64), primary_key=True, index=True) # ps_{user_id}_{timestamp}
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    symbol = Column(String(32), nullable=False, index=True) # e.g. TATASIL, RELIANCE
    script_type = Column(String(32), default="STRATEGY") # "STRATEGY" or "INDICATOR"
    strategy_preset = Column(String(64), default="TIMESFM_NEURAL_BANDS")
    timeframe = Column(String(16), default="15m") # "1m", "5m", "15m", "1h", "1D"
    pine_version = Column(String(8), default="v5")
    code = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    inputs_json = Column(Text, nullable=True, default="{}")
    backtest_stats_json = Column(Text, nullable=True, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def inputs(self):
        try:
            return json.loads(self.inputs_json or "{}")
        except Exception:
            return {}

    @inputs.setter
    def inputs(self, val):
        self.inputs_json = json.dumps(val or {})

    @property
    def backtest_stats(self):
        try:
            return json.loads(self.backtest_stats_json or "{}")
        except Exception:
            return {}

    @backtest_stats.setter
    def backtest_stats(self, val):
        self.backtest_stats_json = json.dumps(val or {})

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "symbol": self.symbol,
            "script_type": self.script_type,
            "strategy_preset": self.strategy_preset,
            "timeframe": self.timeframe,
            "pine_version": self.pine_version,
            "code": self.code,
            "description": self.description or "",
            "inputs": self.inputs,
            "backtest_stats": self.backtest_stats,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else ""
        }
