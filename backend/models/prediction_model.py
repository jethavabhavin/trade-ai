import json
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text
from backend.database import Base

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
