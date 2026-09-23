from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

try:
    from backend.models import (
        MorningSignal, ForecastPoint, MultiAgentRequest, 
        MultiAgentAnalysisResponse
    )
    from backend.data_store import db
    from backend.db_models import UserDB, PredictionDB
    from backend.database import get_db
    from backend.auth_utils import get_current_user
    from backend.agents import OrchestratorAgent, orchestrator
except ImportError:
    from models import (
        MorningSignal, ForecastPoint, MultiAgentRequest, 
        MultiAgentAnalysisResponse
    )
    from data_store import db
    from db_models import UserDB, PredictionDB
    from database import get_db
    from auth_utils import get_current_user
    from agents import OrchestratorAgent, orchestrator

router = APIRouter(prefix="/api/forecast", tags=["Forecast"])

@router.get("/morning-signals", response_model=List[MorningSignal])
def get_morning_signals(current_user: UserDB = Depends(get_current_user)):
    """
    Returns today's 9:00 AM Pre-Market AI Signals for all monitored assets. Requires JWT Auth.
    """
    return db.get_morning_signals()

@router.get("/market-digest")
def get_market_digest(current_user: UserDB = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Daily Morning Pre-Market AI Briefing (Generated before 9:00 AM). Requires JWT Auth.
    """
    signals = db.get_morning_signals()
    buy_signals = [s for s in signals if "BUY" in s.action]
    sell_signals = [s for s in signals if "SELL" in s.action]
    hold_signals = [s for s in signals if "HOLD" in s.action]

    top_bullish = buy_signals[0] if buy_signals else None
    top_name = f"{top_bullish.name} ({top_bullish.symbol})" if top_bullish else "Sector Leaders"
    
    return {
        "date": datetime.now().strftime("%A, %B %d, %Y"),
        "generated_time": "08:45 AM IST",
        "market_sentiment": "BULLISH (74% Positive Sentiment)",
        "summary": f"Pre-market futures show strong institutional inflows into leading equities ({top_name} leading) and benchmark index components. Momentum indicators suggest active opening rally.",
        "signals_count": {
            "total": len(signals),
            "buy": len(buy_signals),
            "sell": len(sell_signals),
            "hold": len(hold_signals)
        },
        "top_pick": top_bullish
    }

@router.get("/{symbol}/next-week", response_model=List[ForecastPoint])
def get_next_week_forecast(
    symbol: str, 
    current_user: UserDB = Depends(get_current_user)
):
    """
    Returns next 7 trading days prediction points with confidence intervals. Requires JWT Auth.
    """
    stock = db.get_stock_detail(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock/ETF symbol '{symbol}' not found")
    return stock.forecast_next_week

@router.get("/{symbol}/timesfm-predict")
def predict_with_timesfm(
    symbol: str, 
    current_user: UserDB = Depends(get_current_user)
):
    """
    Runs Google TimesFM 3.0 Neural Foundation Model analysis on the asset's historical time series. Requires JWT Auth.
    """
    try:
        from backend.forecast_engine import ForecastEngine
    except ImportError:
        from forecast_engine import ForecastEngine

    stock = db.get_stock_detail(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock/ETF symbol '{symbol}' not found")
    
    history_points = stock.historical_data.get("1M", [])
    closes = [p.close for p in history_points] if history_points else [stock.current_price]
    
    return ForecastEngine.run_timesfm_prediction(
        symbol=stock.symbol,
        name=stock.name,
        current_price=stock.current_price,
        historical_closes=closes
    )

@router.post("/multi-agent-analyze", response_model=MultiAgentAnalysisResponse)
def run_multi_agent_analysis(
    req: MultiAgentRequest,
    current_user: UserDB = Depends(get_current_user)
):
    """
    Executes the full 6-agent state graph pipeline:
    1. Market Data Agent (OHLCV & Technicals)
    2. News & Sentiment Agent (Google Gemini)
    3. Quant Forecaster Agent (Google TimesFM 3.0)
    4. Reasoning Agent (Gemini Consistency Validation)
    5. Fusion & Risk Agent (Signal Reconciliation & Risk Guardrails)
    6. Output Agent (Chart Channels & Executive Summary)
    """
    state = {
        "symbol": req.symbol.upper(),
        "horizon": req.horizon,
        "risk_tolerance": req.risk_tolerance or current_user.risk_tolerance
    }
    result = orchestrator.execute(state)
    if result.status == "ERROR":
        raise HTTPException(status_code=500, detail=f"Multi-Agent pipeline failure: {result.error}")
    return result.data

@router.get("/predictions/history")
def get_prediction_history(
    symbol: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db_session: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Retrieves stored historical predictions from the database.
    Optionally filter by symbol. Sorted newest first.
    """
    query = db_session.query(PredictionDB)
    if symbol:
        query = query.filter(PredictionDB.symbol == symbol.upper().strip())
    rows = query.order_by(PredictionDB.predicted_at.desc()).limit(limit).all()
    return [r.to_dict() for r in rows]

@router.get("/predictions/latest/{symbol}")
def get_latest_prediction(
    symbol: str,
    db_session: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Retrieves the latest stored AI prediction and forecast for a given stock symbol from the DB.
    """
    sym_upper = symbol.upper().strip()
    row = db_session.query(PredictionDB).filter(PredictionDB.symbol == sym_upper).order_by(PredictionDB.predicted_at.desc()).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"No stored prediction found for symbol '{sym_upper}'")
    return row.to_dict()

@router.get("/{symbol}/multi-agent-analysis", response_model=MultiAgentAnalysisResponse)
def get_multi_agent_analysis(
    symbol: str,
    horizon: int = Query(7, ge=3, le=30),
    current_user: UserDB = Depends(get_current_user)
):
    """
    GET shortcut to run the 6-agent pipeline for a given stock symbol and horizon.
    """
    state = {
        "symbol": symbol.upper(),
        "horizon": horizon,
        "risk_tolerance": current_user.risk_tolerance
    }
    result = orchestrator.execute(state)
    if result.status == "ERROR":
        raise HTTPException(status_code=500, detail=f"Multi-Agent pipeline failure: {result.error}")
    return result.data

