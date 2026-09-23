from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, UniqueConstraint
from backend.database import Base

class WishlistDB(Base):
    """
    Dedicated relational schema for user wishlist / watchlist assets.
    Tracks target buy prices, notes, added timestamps, and associated user foreign keys.
    """
    __tablename__ = "wishlists"
    __table_args__ = (
        UniqueConstraint('user_id', 'symbol', name='uq_wishlist_user_symbol'),
        {'extend_existing': True}
    )

    id = Column(String(64), primary_key=True, index=True) # wl_{user_id}_{symbol}
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(32), nullable=False, index=True)
    name = Column(String(128), nullable=True)
    category = Column(String(32), default="EQUITY")
    target_buy_price = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "symbol": self.symbol,
            "name": self.name or self.symbol,
            "category": self.category,
            "target_buy_price": self.target_buy_price,
            "notes": self.notes or "",
            "added_at": self.added_at.strftime("%Y-%m-%d %H:%M:%S") if self.added_at else "",
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else ""
        }
