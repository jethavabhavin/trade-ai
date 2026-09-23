import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

try:
    from backend.models import StockDetail, PricePoint, MorningSignal, ForecastPoint
    from backend.forecast_engine import ForecastEngine
    from backend.services.symbol_registry_service import SymbolRegistryService
except ImportError:
    from models import StockDetail, PricePoint, MorningSignal, ForecastPoint
    from forecast_engine import ForecastEngine
    from services.symbol_registry_service import SymbolRegistryService

logger = logging.getLogger("TradeStoreService")

class TradeStoreService:
    """
    Manages persistent storage and retrieval of full trade records,
    historical OHLCV candle datasets, fundamentals, and generated forecasts in the system database.
    """

    @classmethod
    def save_trade_data_to_db(cls, detail: StockDetail, source: str = "NSE") -> bool:
        """
        Persists live trade quotes, OHLCV candle datasets, and fundamentals to the database.
        Stores trade data once fetched from NSE site / market feed.
        """
        try:
            from backend.database import SessionLocal
            from backend.db_models import TradeDataDB
        except ImportError:
            from database import SessionLocal
            from db_models import TradeDataDB

        db_session = None
        try:
            db_session = SessionLocal()
            sym = detail.symbol.upper().strip()

            # Serialize multi-timeframe historical candles to plain JSON dicts
            serialized_hist = {}
            for tf, pts in (detail.historical_data or {}).items():
                serialized_hist[tf] = [
                    p.dict() if hasattr(p, 'dict') else (p.model_dump() if hasattr(p, 'model_dump') else p) 
                    for p in pts
                ]

            ticker = SymbolRegistryService.resolve_ticker(sym)
            existing = db_session.query(TradeDataDB).filter(TradeDataDB.symbol == sym).first()
            if existing:
                existing.ticker = ticker
                existing.name = detail.name
                existing.category = detail.category
                existing.exchange = detail.exchange
                existing.currency = detail.currency
                existing.current_price = detail.current_price
                existing.change_amount = detail.change_amount
                existing.change_pct = detail.change_pct
                existing.previous_close = detail.previous_close
                existing.today_open = detail.today_open
                existing.day_high = detail.day_high
                existing.day_low = detail.day_low
                existing.week_high_52 = detail.week_high_52
                existing.week_low_52 = detail.week_low_52
                existing.volume_24h = detail.volume_24h
                existing.market_cap = detail.market_cap
                existing.pe_ratio = detail.pe_ratio
                existing.description = detail.description
                existing.historical_data_json = json.dumps(serialized_hist)
                existing.sparkline_json = json.dumps(detail.sparkline or [])
                existing.source = source
                existing.fetched_at = datetime.utcnow()
                existing.updated_at = datetime.utcnow()
            else:
                new_trade = TradeDataDB(
                    symbol=sym,
                    ticker=ticker,
                    name=detail.name,
                    category=detail.category,
                    exchange=detail.exchange,
                    currency=detail.currency,
                    current_price=detail.current_price,
                    change_amount=detail.change_amount,
                    change_pct=detail.change_pct,
                    previous_close=detail.previous_close,
                    today_open=detail.today_open,
                    day_high=detail.day_high,
                    day_low=detail.day_low,
                    week_high_52=detail.week_high_52,
                    week_low_52=detail.week_low_52,
                    volume_24h=detail.volume_24h,
                    market_cap=detail.market_cap,
                    pe_ratio=detail.pe_ratio,
                    description=detail.description,
                    historical_data_json=json.dumps(serialized_hist),
                    sparkline_json=json.dumps(detail.sparkline or []),
                    source=source,
                    fetched_at=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db_session.add(new_trade)

            db_session.commit()
            return True
        except Exception as e:
            if db_session is not None:
                db_session.rollback()
            logger.error(f"Error saving trade data to DB for {detail.symbol}: {e}")
            return False
        finally:
            if db_session is not None:
                db_session.close()

    @classmethod
    def get_trade_data_from_db(cls, symbol: str, max_age_seconds: Optional[float] = None) -> Optional[StockDetail]:
        """
        Checks if trade data exists in system database.
        If present and fresh (within max_age_seconds), rebuilds StockDetail without calling external API.
        """
        try:
            from backend.database import SessionLocal
            from backend.db_models import TradeDataDB
        except ImportError:
            from database import SessionLocal
            from db_models import TradeDataDB

        sym_upper = symbol.upper().strip()
        db_session = None
        try:
            db_session = SessionLocal()
            row = db_session.query(TradeDataDB).filter(TradeDataDB.symbol == sym_upper).first()
            if not row:
                return None

            if max_age_seconds is not None and row.fetched_at:
                age = (datetime.utcnow() - row.fetched_at).total_seconds()
                if age > max_age_seconds:
                    return None

            # Parse historical candle arrays
            raw_hist = row.historical_data or {}
            parsed_hist: Dict[str, List[PricePoint]] = {}
            for tf, pts in raw_hist.items():
                parsed_pts = []
                for p in pts:
                    if isinstance(p, dict):
                        parsed_pts.append(PricePoint(**p))
                    elif hasattr(p, 'close'):
                        parsed_pts.append(p)
                parsed_hist[tf] = parsed_pts

            # Generate forecasts and morning signals from stored series
            history_1m = parsed_hist.get("1M", [])
            closes = [p.close for p in history_1m] if history_1m else [row.current_price]

            f_points = ForecastEngine.generate_next_week_forecast(
                base_price=row.current_price,
                historical_close_prices=closes
            )
            f_1d = ForecastEngine.generate_one_day_forecast(
                base_price=row.current_price,
                historical_close_prices=closes
            )
            m_signal = ForecastEngine.generate_morning_signal(
                symbol=row.symbol,
                name=row.name,
                current_price=row.current_price,
                history=history_1m,
                custom_rationale=f"Reconstructed from persistent trade store ({len(closes)} daily bars)."
            )

            detail = StockDetail(
                symbol=row.symbol,
                name=row.name,
                category=row.category,
                exchange=row.exchange,
                current_price=row.current_price,
                change_amount=row.change_amount,
                change_pct=row.change_pct,
                currency=row.currency,
                volume_24h=row.volume_24h,
                market_cap=row.market_cap,
                description=row.description or f"Stored market trade asset {row.symbol}.",
                week_high_52=row.week_high_52,
                week_low_52=row.week_low_52,
                day_high=row.day_high,
                day_low=row.day_low,
                pe_ratio=row.pe_ratio,
                historical_data=parsed_hist,
                forecast_next_week=f_points,
                forecast_1d=f_1d,
                morning_signal=m_signal,
                sparkline=row.sparkline or closes[-15:],
                previous_close=row.previous_close,
                today_open=row.today_open
            )
            return detail
        except Exception as e:
            logger.error(f"Error reading trade data from DB for {sym_upper}: {e}")
            return None
        finally:
            if db_session is not None:
                db_session.close()
