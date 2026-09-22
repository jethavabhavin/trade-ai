from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session

try:
    from backend.models import PortfolioSummary, PortfolioPosition
    from backend.data_store import db as stock_db
    from backend.database import get_db
    from backend.db_models import UserDB
    from backend.auth_utils import get_current_user, log_audit_event
except ImportError:
    from models import PortfolioSummary, PortfolioPosition
    from data_store import db as stock_db
    from database import get_db
    from db_models import UserDB
    from auth_utils import get_current_user, log_audit_event

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

@router.get("", response_model=PortfolioSummary)
def get_portfolio(current_user: UserDB = Depends(get_current_user)):
    """
    Returns current positions and profit/loss summary for the authenticated user.
    """
    return stock_db.get_portfolio_summary(current_user.id)

@router.post("/trade")
def execute_trade(
    symbol: str, 
    shares: float, 
    action: str, # "BUY" or "SELL"
    req: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes paper buy/sell order for the authenticated user and logs audit history.
    """
    if shares <= 0:
        raise HTTPException(status_code=400, detail="Share quantity must be greater than zero.")

    stock = stock_db.get_stock_detail(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
    
    user_id = current_user.id
    positions = stock_db.portfolio_positions.get(user_id, [])
    existing_pos = next((p for p in positions if p.symbol == symbol.upper()), None)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    action_clean = action.upper()

    if action_clean == "BUY":
        total_cost = round(shares * stock.current_price, 2)
        if existing_pos:
            total_shares = existing_pos.shares + shares
            new_inv = existing_pos.invested_amount + total_cost
            existing_pos.shares = total_shares
            existing_pos.average_buy_price = round(new_inv / total_shares, 2)
            existing_pos.invested_amount = round(new_inv, 2)
        else:
            new_pos = PortfolioPosition(
                id=f"pos_{len(positions) + 1}",
                symbol=stock.symbol,
                name=stock.name,
                shares=shares,
                average_buy_price=stock.current_price,
                current_price=stock.current_price,
                invested_amount=total_cost,
                current_value=total_cost,
                unrealized_pnl=0.0,
                unrealized_pnl_pct=0.0,
                buy_date=today_str
            )
            positions.append(new_pos)
            stock_db.portfolio_positions[user_id] = positions
    elif action_clean == "SELL":
        if not existing_pos or existing_pos.shares < shares:
            raise HTTPException(status_code=400, detail="Insufficient shares to execute sell order")
        if existing_pos.shares == shares:
            positions.remove(existing_pos)
        else:
            existing_pos.shares -= shares
            existing_pos.invested_amount = round(existing_pos.shares * existing_pos.average_buy_price, 2)
    else:
        raise HTTPException(status_code=400, detail="Invalid trade action. Must be 'BUY' or 'SELL'.")

    # Record trade audit event
    log_audit_event(
        db=db,
        action="TRADE",
        user_id=current_user.id,
        username=current_user.username,
        details=f"Executed {action_clean} {shares} units of {stock.symbol} at {stock.currency}{stock.current_price}",
        ip_address=req.client.host if req.client else "127.0.0.1"
    )

    return stock_db.get_portfolio_summary(user_id)
