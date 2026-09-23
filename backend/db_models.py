"""
TradeAI Database Models Facade (Backward Compatibility)
Re-exports all SQLAlchemy DB entities from `backend.models`.
"""
from backend.database import Base
from backend.models.user_model import UserDB, AuditLogDB
from backend.models.symbol_model import MarketSymbolDB
from backend.models.trade_model import TradeDataDB
from backend.models.prediction_model import PredictionDB
from backend.models.wishlist_model import WishlistDB
from backend.models.pine_script_model import PineScriptDB

__all__ = [
    "Base",
    "UserDB",
    "AuditLogDB",
    "MarketSymbolDB",
    "TradeDataDB",
    "PredictionDB",
    "WishlistDB",
    "PineScriptDB"
]
