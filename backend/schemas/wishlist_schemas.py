from pydantic import BaseModel
from typing import Optional

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
