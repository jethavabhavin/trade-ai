import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session

try:
    from backend.models import (
        WishlistItemResponse, WishlistAddRequest, WishlistUpdateRequest
    )
    from backend.db_models import UserDB, WishlistDB, MarketSymbolDB
    from backend.database import get_db
    from backend.auth_utils import get_current_user, log_audit_event
    from backend.live_market_service import LiveMarketService
except ImportError:
    from models import (
        WishlistItemResponse, WishlistAddRequest, WishlistUpdateRequest
    )
    from db_models import UserDB, WishlistDB, MarketSymbolDB
    from database import get_db
    from auth_utils import get_current_user, log_audit_event
    from live_market_service import LiveMarketService

logger = logging.getLogger("WishlistRouter")
router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

def _sync_user_watchlist_json(user: UserDB, db_session: Session):
    """Synchronizes UserDB.watchlist_json array with WishlistDB relational records."""
    try:
        items = db_session.query(WishlistDB).filter(WishlistDB.user_id == user.id).all()
        user.watchlist = [item.symbol for item in items]
        db_session.commit()
    except Exception as e:
        logger.error(f"Error syncing user watchlist json: {e}")

@router.get("", response_model=List[WishlistItemResponse])
def get_user_wishlist(
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Retrieves all wishlisted assets for the authenticated user from the database,
    enriched with live market spot prices and 9:00 AM AI signals.
    """
    rows = db_session.query(WishlistDB).filter(
        WishlistDB.user_id == current_user.id
    ).order_by(WishlistDB.added_at.desc()).all()

    response_items: List[WishlistItemResponse] = []
    for r in rows:
        curr_price = None
        chg_pct = None
        chg_amt = None
        currency = "₹"
        sig_action = None
        sig_conf = None
        sig_target = None

        try:
            # Check DB / live market feed for enriched pricing
            stock = LiveMarketService.fetch_live_stock_detail(r.symbol)
            if stock:
                curr_price = stock.current_price
                chg_pct = stock.change_pct
                chg_amt = stock.change_amount
                currency = stock.currency
                if stock.morning_signal:
                    sig_action = stock.morning_signal.action
                    sig_conf = stock.morning_signal.confidence
                    sig_target = stock.morning_signal.target_price
        except Exception:
            pass

        response_items.append(
            WishlistItemResponse(
                id=r.id,
                user_id=r.user_id,
                symbol=r.symbol,
                name=r.name or r.symbol,
                category=r.category or "EQUITY",
                target_buy_price=r.target_buy_price,
                notes=r.notes or "",
                added_at=r.added_at.strftime("%Y-%m-%d %H:%M:%S") if r.added_at else "",
                current_price=curr_price,
                change_amount=chg_amt,
                change_pct=chg_pct,
                currency=currency,
                morning_signal_action=sig_action,
                morning_signal_confidence=sig_conf,
                morning_signal_target=sig_target
            )
        )

    return response_items

@router.get("/symbols", response_model=List[str])
def get_user_wishlist_symbols(
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Returns the array of stock/ETF symbols currently in the user's wishlist.
    """
    rows = db_session.query(WishlistDB.symbol).filter(
        WishlistDB.user_id == current_user.id
    ).all()
    return [r[0] for r in rows]

@router.get("/check/{symbol}")
def check_symbol_in_wishlist(
    symbol: str,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Checks whether a specific stock symbol is in the user's database wishlist.
    """
    sym_upper = symbol.upper().strip()
    row = db_session.query(WishlistDB).filter(
        WishlistDB.user_id == current_user.id,
        WishlistDB.symbol == sym_upper
    ).first()

    return {
        "symbol": sym_upper,
        "is_wishlisted": row is not None,
        "item": row.to_dict() if row else None
    }

@router.post("", response_model=WishlistItemResponse)
def add_to_wishlist(
    req: WishlistAddRequest,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Adds a stock or ETF to the user's database wishlist.
    """
    sym_upper = req.symbol.upper().strip()
    
    # Check if already exists
    existing = db_session.query(WishlistDB).filter(
        WishlistDB.user_id == current_user.id,
        WishlistDB.symbol == sym_upper
    ).first()

    if existing:
        if req.target_buy_price is not None:
            existing.target_buy_price = req.target_buy_price
        if req.notes is not None:
            existing.notes = req.notes
        existing.updated_at = datetime.utcnow()
        db_session.commit()
        _sync_user_watchlist_json(current_user, db_session)
        return WishlistItemResponse(
            id=existing.id,
            user_id=existing.user_id,
            symbol=existing.symbol,
            name=existing.name or sym_upper,
            category=existing.category,
            target_buy_price=existing.target_buy_price,
            notes=existing.notes,
            added_at=existing.added_at.strftime("%Y-%m-%d %H:%M:%S") if existing.added_at else ""
        )

    # Lookup name/category from MarketSymbolDB or live metadata
    name = req.name
    category = req.category or "EQUITY"
    if not name:
        meta_sym = db_session.query(MarketSymbolDB).filter(MarketSymbolDB.symbol == sym_upper).first()
        if meta_sym:
            name = meta_sym.name
            category = meta_sym.category
        else:
            name = sym_upper

    wl_id = f"wl_{current_user.id}_{sym_upper.lower()}"
    new_item = WishlistDB(
        id=wl_id,
        user_id=current_user.id,
        symbol=sym_upper,
        name=name,
        category=category,
        target_buy_price=req.target_buy_price,
        notes=req.notes or "",
        added_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db_session.add(new_item)
    db_session.commit()

    _sync_user_watchlist_json(current_user, db_session)
    log_audit_event(
        db=db_session,
        action="WISHLIST_ADD",
        user_id=current_user.id,
        username=current_user.username,
        details=f"Added {sym_upper} to wishlist"
    )

    return WishlistItemResponse(
        id=new_item.id,
        user_id=new_item.user_id,
        symbol=new_item.symbol,
        name=new_item.name,
        category=new_item.category,
        target_buy_price=new_item.target_buy_price,
        notes=new_item.notes,
        added_at=new_item.added_at.strftime("%Y-%m-%d %H:%M:%S")
    )

@router.delete("/{symbol}")
def remove_from_wishlist(
    symbol: str,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Removes an asset from the user's database wishlist.
    """
    sym_upper = symbol.upper().strip()
    row = db_session.query(WishlistDB).filter(
        WishlistDB.user_id == current_user.id,
        WishlistDB.symbol == sym_upper
    ).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol '{sym_upper}' is not in your wishlist."
        )

    db_session.delete(row)
    db_session.commit()

    _sync_user_watchlist_json(current_user, db_session)
    log_audit_event(
        db=db_session,
        action="WISHLIST_REMOVE",
        user_id=current_user.id,
        username=current_user.username,
        details=f"Removed {sym_upper} from wishlist"
    )

    return {"status": "removed", "symbol": sym_upper, "message": f"{sym_upper} removed from wishlist"}

@router.post("/toggle")
def toggle_wishlist_item(
    symbol: str = Query(..., description="Stock symbol to toggle"),
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    One-click bookmark toggle. If in wishlist -> removes it; if not -> adds it to DB.
    """
    sym_upper = symbol.upper().strip()
    existing = db_session.query(WishlistDB).filter(
        WishlistDB.user_id == current_user.id,
        WishlistDB.symbol == sym_upper
    ).first()

    if existing:
        db_session.delete(existing)
        db_session.commit()
        _sync_user_watchlist_json(current_user, db_session)
        is_wishlisted = False
        status_msg = "removed"
    else:
        meta_sym = db_session.query(MarketSymbolDB).filter(MarketSymbolDB.symbol == sym_upper).first()
        name = meta_sym.name if meta_sym else sym_upper
        category = meta_sym.category if meta_sym else "EQUITY"
        
        new_item = WishlistDB(
            id=f"wl_{current_user.id}_{sym_upper.lower()}",
            user_id=current_user.id,
            symbol=sym_upper,
            name=name,
            category=category,
            added_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db_session.add(new_item)
        db_session.commit()
        _sync_user_watchlist_json(current_user, db_session)
        is_wishlisted = True
        status_msg = "added"

    all_symbols = [r.symbol for r in db_session.query(WishlistDB).filter(WishlistDB.user_id == current_user.id).all()]
    return {
        "status": status_msg,
        "symbol": sym_upper,
        "is_wishlisted": is_wishlisted,
        "watchlist": all_symbols
    }

@router.put("/{symbol}", response_model=WishlistItemResponse)
def update_wishlist_item(
    symbol: str,
    req: WishlistUpdateRequest,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Updates custom target buy price or personal notes for a wishlisted asset.
    """
    sym_upper = symbol.upper().strip()
    row = db_session.query(WishlistDB).filter(
        WishlistDB.user_id == current_user.id,
        WishlistDB.symbol == sym_upper
    ).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol '{sym_upper}' is not in your wishlist."
        )

    if req.target_buy_price is not None:
        row.target_buy_price = req.target_buy_price
    if req.notes is not None:
        row.notes = req.notes
    row.updated_at = datetime.utcnow()

    db_session.commit()

    return WishlistItemResponse(
        id=row.id,
        user_id=row.user_id,
        symbol=row.symbol,
        name=row.name or row.symbol,
        category=row.category,
        target_buy_price=row.target_buy_price,
        notes=row.notes or "",
        added_at=row.added_at.strftime("%Y-%m-%d %H:%M:%S") if row.added_at else ""
    )
