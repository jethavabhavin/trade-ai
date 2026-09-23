from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
try:
    from backend.models import StockSummary, StockDetail, PricePoint
    from backend.data_store import db
    from backend.db_models import UserDB
    from backend.auth_utils import get_current_user, get_optional_current_user
except ImportError:
    from models import StockSummary, StockDetail, PricePoint
    from data_store import db
    from db_models import UserDB
    from auth_utils import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

@router.get("", response_model=List[StockSummary])
def get_stocks(
    category: Optional[str] = None,
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    """
    Returns market asset summaries (ETFs, Stocks, Indices).
    """
    stocks = db.get_all_summaries()
    if category and category.upper() != "ALL":
        stocks = [s for s in stocks if s.category.upper() == category.upper()]
    return stocks

@router.get("/symbols/list")
def get_monitored_symbols_list(
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    """
    Returns list of all active market symbols registered and monitored in the database.
    """
    try:
        from backend.database import SessionLocal
        from backend.db_models import MarketSymbolDB
    except ImportError:
        from database import SessionLocal
        from db_models import MarketSymbolDB
    
    db_session = SessionLocal()
    try:
        symbols = db_session.query(MarketSymbolDB).filter(MarketSymbolDB.is_active == True).all()
        return [s.to_dict() for s in symbols]
    finally:
        db_session.close()

@router.post("/symbols/sync")
def sync_market_symbols_from_api(
    current_user: UserDB = Depends(get_current_user)
):
    """
    Triggers on-demand fetch and sync of official market asset metadata from API into database.
    """
    try:
        from backend.live_market_service import LiveMarketService
    except ImportError:
        from live_market_service import LiveMarketService
    
    synced = LiveMarketService.sync_symbols_to_db()
    return {"status": "success", "message": f"Successfully synced {len(synced)} symbols from API to database", "symbols": synced}

@router.get("/search", response_model=List[StockSummary])
def search_stocks(
    q: str = Query(..., min_length=1),
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    """
    Search stocks and ETFs by ticker or company name.
    """
    return db.search_stocks(q)

@router.get("/{symbol}", response_model=StockDetail)
def get_stock_detail(
    symbol: str,
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    """
    Returns detailed candlestick, metrics, and forecast data for an asset.
    """
    stock = db.get_stock_detail(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock/ETF symbol '{symbol}' not found")
    return stock

@router.get("/{symbol}/timeframe/{timeframe}", response_model=List[PricePoint])
def get_timeframe_data(
    symbol: str, 
    timeframe: str,
    current_user: Optional[UserDB] = Depends(get_optional_current_user)
):
    """
    Returns historical price points for 1D, 1W, 1M, 1Y, 5Y.
    """
    stock = db.get_stock_detail(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock/ETF symbol '{symbol}' not found")
    
    tf = timeframe.upper()
    if tf not in stock.historical_data:
        tf = "1D"
    
    return stock.historical_data.get(tf, [])
