import time
import math
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from backend.models import StockSummary, StockDetail, PricePoint, MorningSignal, ForecastPoint
    from backend.forecast_engine import ForecastEngine
    from backend.services.symbol_registry_service import SymbolRegistryService
    from backend.services.trade_store_service import TradeStoreService
    from backend.services.mock_data_service import MockDataService
except ImportError:
    from models import StockSummary, StockDetail, PricePoint, MorningSignal, ForecastPoint
    from forecast_engine import ForecastEngine
    from services.symbol_registry_service import SymbolRegistryService
    from services.trade_store_service import TradeStoreService
    from services.mock_data_service import MockDataService

logger = logging.getLogger("MarketDataService")

class MarketDataService:
    """
    High-Performance Live Market Data Service integrating live quote feeds (Yahoo Finance & NSE India),
    timeframe resampling, AI morning signal computation, and automated database sync.
    """
    _cache_summaries: Optional[List[StockSummary]] = None
    _cache_summaries_time: float = 0.0
    _cache_details: Dict[str, Dict[str, Any]] = {}
    CACHE_TTL_SECONDS = 45.0  # 45 seconds fresh cache

    @classmethod
    def fetch_nse_quote_live(cls, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetches live quote directly from official NSE India API.
        """
        sym_clean = symbol.upper().replace(".NS", "").replace("^", "").strip()
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": f"https://www.nseindia.com/get-quotes/equity?symbol={sym_clean}",
            "Connection": "keep-alive"
        }
        try:
            import requests
            session = requests.Session()
            session.headers.update(headers)
            try:
                session.get("https://www.nseindia.com", timeout=3)
            except Exception:
                pass

            res = session.get(f"https://www.nseindia.com/api/quote-equity?symbol={sym_clean}", timeout=4)
            if res.status_code == 200:
                data = res.json()
                price_info = data.get("priceInfo", {})
                info = data.get("info", {})
                if price_info.get("lastPrice"):
                    return {
                        "symbol": sym_clean,
                        "name": info.get("companyName", sym_clean),
                        "current_price": float(price_info.get("lastPrice")),
                        "change": float(price_info.get("change", 0.0)),
                        "pChange": float(price_info.get("pChange", 0.0)),
                        "previousClose": float(price_info.get("previousClose", price_info.get("lastPrice"))),
                        "open": float(price_info.get("open", price_info.get("lastPrice"))),
                        "dayHigh": float(price_info.get("intraDayHighLow", {}).get("max", price_info.get("lastPrice"))),
                        "dayLow": float(price_info.get("intraDayHighLow", {}).get("min", price_info.get("lastPrice"))),
                        "weekHigh52": float(price_info.get("weekHighLow", {}).get("max", price_info.get("lastPrice"))),
                        "weekLow52": float(price_info.get("weekHighLow", {}).get("min", price_info.get("lastPrice"))),
                        "totalTradedVolume": data.get("preOpenMarket", {}).get("totalTradedVolume", 100000)
                    }
        except Exception as ex:
            logger.debug(f"Direct NSE quote fetch notice for {sym_clean}: {ex}")
        return None

    @classmethod
    def fetch_live_stock_detail(
        cls,
        symbol: str,
        fallback_detail: Optional[StockDetail] = None,
        force_refresh: bool = False
    ) -> StockDetail:
        """
        Fetches stock trade data, multi-timeframe candles, and AI forecasts.
        Checks system database first; if exists and fresh, uses it immediately; else queries live feeds,
        and saves trade data to DB once fetched.
        """
        symbol_upper = symbol.upper().strip()
        now_ts = time.time()

        # 1. Use system / DB data first if exists and fresh
        if not force_refresh:
            if symbol_upper in cls._cache_details:
                cached_data = cls._cache_details[symbol_upper]["data"]
                cache_time = cls._cache_details[symbol_upper]["time"]
                if (now_ts - cache_time) < cls.CACHE_TTL_SECONDS:
                    return cached_data

            db_trade = TradeStoreService.get_trade_data_from_db(symbol_upper, max_age_seconds=cls.CACHE_TTL_SECONDS)
            if db_trade is not None:
                cls._cache_details[symbol_upper] = {
                    "data": db_trade,
                    "time": now_ts
                }
                return db_trade

        yf_ticker = SymbolRegistryService.resolve_ticker(symbol_upper)

        # Retrieve metadata from DB or API
        meta = None
        s_db = None
        try:
            try:
                from backend.database import SessionLocal
                from backend.db_models import MarketSymbolDB
            except ImportError:
                from database import SessionLocal
                from db_models import MarketSymbolDB
            s_db = SessionLocal()
            row = s_db.query(MarketSymbolDB).filter(MarketSymbolDB.symbol == symbol_upper).first()
            if row:
                meta = {
                    "name": row.name,
                    "category": row.category,
                    "exchange": row.exchange,
                    "currency": row.currency,
                    "description": row.description or f"Live real-time market asset {symbol_upper}."
                }
        except Exception:
            pass
        finally:
            if s_db is not None:
                s_db.close()

        if not meta:
            meta = SymbolRegistryService.fetch_symbol_metadata_from_api(symbol_upper)

        try:
            import yfinance as yf
            ticker_obj = yf.Ticker(yf_ticker)

            # 1. Fetch live 3-month daily history for quotes & technicals
            df_daily = ticker_obj.history(period="3mo", interval="1d", timeout=5.0)
            if df_daily is None or df_daily.empty:
                raise ValueError(f"No market data returned for {yf_ticker}")

            closes = df_daily["Close"].dropna().tolist()
            if not closes:
                raise ValueError("Empty closes series")

            current_p = round(float(closes[-1]), 2)
            prev_p = round(float(closes[-2]), 2) if len(closes) > 1 else current_p
            change_amt = round(current_p - prev_p, 2)
            change_pct = round((change_amt / prev_p * 100.0) if prev_p > 0 else 0.0, 2)

            highs = df_daily["High"].dropna().tolist()
            lows = df_daily["Low"].dropna().tolist()
            volumes = df_daily["Volume"].dropna().tolist()
            opens = df_daily["Open"].dropna().tolist()

            today_open = round(float(opens[-1]), 2) if opens else current_p
            day_high = round(float(highs[-1]), 2) if highs else current_p
            day_low = round(float(lows[-1]), 2) if lows else current_p
            vol_last = int(volumes[-1]) if volumes else 100000

            # 2. Build multi-timeframe candle datasets
            historical_data: Dict[str, List[PricePoint]] = {}

            # 1D: intraday (5m)
            df_1d = ticker_obj.history(period="1d", interval="5m", timeout=4.0)
            if df_1d is not None and not df_1d.empty and len(df_1d) >= 5:
                pts_1d = []
                for idx, r in df_1d.iterrows():
                    ts = idx.to_pydatetime()
                    pts_1d.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=ts.strftime("%H:%M"),
                        open=round(float(r["Open"]), 2),
                        high=round(float(r["High"]), 2),
                        low=round(float(r["Low"]), 2),
                        close=round(float(r["Close"]), 2),
                        volume=int(r["Volume"]) if "Volume" in r and not math.isnan(r["Volume"]) else 1000
                    ))
                historical_data["1D"] = pts_1d
            elif fallback_detail and "1D" in fallback_detail.historical_data:
                historical_data["1D"] = fallback_detail.historical_data["1D"]

            # 1W: 5 days hourly
            df_1w = ticker_obj.history(period="5d", interval="60m", timeout=4.0)
            if df_1w is not None and not df_1w.empty and len(df_1w) >= 5:
                pts_1w = []
                for idx, r in df_1w.iterrows():
                    ts = idx.to_pydatetime()
                    pts_1w.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=f"{ts.strftime('%a')} {ts.strftime('%H:%M')}",
                        open=round(float(r["Open"]), 2),
                        high=round(float(r["High"]), 2),
                        low=round(float(r["Low"]), 2),
                        close=round(float(r["Close"]), 2),
                        volume=int(r["Volume"]) if "Volume" in r and not math.isnan(r["Volume"]) else 5000
                    ))
                historical_data["1W"] = pts_1w
            elif fallback_detail and "1W" in fallback_detail.historical_data:
                historical_data["1W"] = fallback_detail.historical_data["1W"]

            # 1M: 30 days daily
            pts_1m = []
            for idx, r in df_daily.tail(30).iterrows():
                ts = idx.to_pydatetime()
                pts_1m.append(PricePoint(
                    timestamp=ts.isoformat(),
                    time_label=ts.strftime("%b %d"),
                    open=round(float(r["Open"]), 2),
                    high=round(float(r["High"]), 2),
                    low=round(float(r["Low"]), 2),
                    close=round(float(r["Close"]), 2),
                    volume=int(r["Volume"]) if "Volume" in r and not math.isnan(r["Volume"]) else 25000
                ))
            historical_data["1M"] = pts_1m

            # 1Y: 1 year weekly / daily
            df_1y = ticker_obj.history(period="1y", interval="1wk", timeout=4.0)
            if df_1y is not None and not df_1y.empty:
                pts_1y = []
                for idx, r in df_1y.iterrows():
                    ts = idx.to_pydatetime()
                    pts_1y.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=ts.strftime("%b %d"),
                        open=round(float(r["Open"]), 2),
                        high=round(float(r["High"]), 2),
                        low=round(float(r["Low"]), 2),
                        close=round(float(r["Close"]), 2),
                        volume=int(r["Volume"]) if "Volume" in r and not math.isnan(r["Volume"]) else 100000
                    ))
                historical_data["1Y"] = pts_1y
            elif fallback_detail and "1Y" in fallback_detail.historical_data:
                historical_data["1Y"] = fallback_detail.historical_data["1Y"]

            # 5Y: 5 years monthly
            df_5y = ticker_obj.history(period="5y", interval="1mo", timeout=4.0)
            if df_5y is not None and not df_5y.empty:
                pts_5y = []
                for idx, r in df_5y.iterrows():
                    ts = idx.to_pydatetime()
                    pts_5y.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=ts.strftime("%b %Y"),
                        open=round(float(r["Open"]), 2),
                        high=round(float(r["High"]), 2),
                        low=round(float(r["Low"]), 2),
                        close=round(float(r["Close"]), 2),
                        volume=int(r["Volume"]) if "Volume" in r and not math.isnan(r["Volume"]) else 500000
                    ))
                historical_data["5Y"] = pts_5y
            elif fallback_detail and "5Y" in fallback_detail.historical_data:
                historical_data["5Y"] = fallback_detail.historical_data["5Y"]

            # Fallback candle builders if specific interval returns empty
            if "1D" not in historical_data:
                pts_1d = [
                    PricePoint(
                        timestamp=datetime.now().replace(hour=9, minute=15, second=0).isoformat(),
                        time_label="09:15",
                        open=round(float(df_daily["Open"].iloc[-1]), 2),
                        high=round(day_high, 2),
                        low=round(day_low, 2),
                        close=round(current_p, 2),
                        volume=vol_last
                    ),
                    PricePoint(
                        timestamp=datetime.now().isoformat(),
                        time_label="Live",
                        open=round(float(df_daily["Open"].iloc[-1]), 2),
                        high=round(day_high, 2),
                        low=round(day_low, 2),
                        close=round(current_p, 2),
                        volume=vol_last
                    )
                ]
                historical_data["1D"] = pts_1d

            if "1W" not in historical_data:
                pts_1w = []
                for idx, r in df_daily.tail(7).iterrows():
                    ts = idx.to_pydatetime()
                    pts_1w.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=f"{ts.strftime('%a')} {ts.strftime('%H:%M')}",
                        open=round(float(r["Open"]), 2),
                        high=round(float(r["High"]), 2),
                        low=round(float(r["Low"]), 2),
                        close=round(float(r["Close"]), 2),
                        volume=int(r["Volume"]) if "Volume" in r and not math.isnan(r["Volume"]) else 5000
                    ))
                historical_data["1W"] = pts_1w

            if "1Y" not in historical_data:
                historical_data["1Y"] = pts_1m
            if "5Y" not in historical_data:
                historical_data["5Y"] = pts_1m

            # 3. Fundamentals & Metadata
            try:
                fast_info = ticker_obj.fast_info
                w52_high = round(float(getattr(fast_info, "year_high", max(highs))), 2)
                w52_low = round(float(getattr(fast_info, "year_low", min(lows))), 2)
                mcap = getattr(fast_info, "market_cap", None)
                if mcap:
                    mcap_str = f"₹{mcap / 1e12:.1f}T" if meta["currency"] == "₹" else f"${mcap / 1e9:.1f}B"
                else:
                    mcap_str = f"{meta['currency']}100B"
            except Exception:
                w52_high = round(max(highs), 2)
                w52_low = round(min(lows), 2)
                mcap_str = f"{meta['currency']}100B"

            # 4. Multi-Horizon Forecasts
            clean_closes = [round(float(c), 2) for c in closes]
            forecast_points = ForecastEngine.generate_next_week_forecast(
                base_price=current_p,
                historical_close_prices=clean_closes
            )
            forecast_1d = ForecastEngine.generate_one_day_forecast(
                base_price=current_p,
                historical_close_prices=clean_closes
            )

            # 5. Calculate Live 9:00 AM Morning Signal
            morning_signal = ForecastEngine.generate_morning_signal(
                symbol=symbol_upper,
                name=meta["name"],
                current_price=current_p,
                history=historical_data.get("1M", []),
                custom_rationale=f"Live market quote updated. Real-time momentum calculated from {len(clean_closes)} live exchange bars."
            )

            # Persist prediction to DB
            try:
                ForecastEngine.save_prediction_to_db(
                    symbol=symbol_upper,
                    name=meta["name"],
                    current_price=current_p,
                    target_price=morning_signal.target_price,
                    stop_loss=morning_signal.stop_loss,
                    expected_roi_pct=morning_signal.expected_roi_pct,
                    action=morning_signal.action,
                    confidence_score=float(morning_signal.confidence),
                    risk_level=morning_signal.risk_level,
                    model_name="TradeAI Multi-Horizon Neural Engine",
                    horizon="7D",
                    forecast_1d=forecast_1d,
                    forecast_7d=forecast_points,
                    technical_catalysts=morning_signal.technical_catalysts,
                    sentiment_score=morning_signal.sentiment_score,
                    rsi=morning_signal.rsi,
                    macd_signal=morning_signal.macd_signal,
                    rationale=morning_signal.rationale
                )
            except Exception as pe:
                logger.debug(f"Async DB prediction persist note: {pe}")

            sparkline = clean_closes[-15:] if len(clean_closes) >= 15 else [current_p] * 15

            live_detail = StockDetail(
                symbol=symbol_upper,
                name=meta["name"],
                category=meta["category"],
                exchange=meta["exchange"],
                current_price=current_p,
                change_amount=change_amt,
                change_pct=change_pct,
                currency=meta["currency"],
                volume_24h=f"{vol_last / 1e6:.1f}M" if vol_last > 1e6 else f"{vol_last / 1e3:.0f}K",
                market_cap=mcap_str,
                description=meta.get("description", f"Live tracked asset {symbol_upper}."),
                week_high_52=w52_high,
                week_low_52=w52_low,
                day_high=day_high,
                day_low=day_low,
                pe_ratio=24.5,
                historical_data=historical_data,
                forecast_next_week=forecast_points,
                forecast_1d=forecast_1d,
                morning_signal=morning_signal,
                sparkline=sparkline,
                previous_close=prev_p,
                today_open=today_open
            )

            # Store in DB Trade Data Repository
            try:
                TradeStoreService.save_trade_data_to_db(live_detail, source="NSE")
            except Exception as se:
                logger.debug(f"Async DB trade data persist note: {se}")

            # Store in Memory Cache
            cls._cache_details[symbol_upper] = {
                "data": live_detail,
                "time": now_ts
            }
            return live_detail

        except Exception as e:
            logger.warning(f"Live market fetch notice for {symbol_upper} ({e}). Checking persistent trade data in DB...")
            # Fallback 1: Database persistent store
            db_trade = TradeStoreService.get_trade_data_from_db(symbol_upper, max_age_seconds=None)
            if db_trade:
                logger.info(f"Loaded stored trade data for {symbol_upper} from DB repository.")
                return db_trade

            # Fallback 2: Caller provided fallback
            if fallback_detail:
                return fallback_detail

            # Fallback 3: Synthetic mock generator
            return MockDataService.generate_fallback_stock_detail(symbol_upper)

    @classmethod
    def get_live_summaries(cls, symbols: Optional[List[str]] = None) -> List[StockSummary]:
        """
        Returns real-time summaries for all monitored stocks directly from live market queries.
        Uses cached data or updates live tickers in parallel.
        """
        now_ts = time.time()
        if cls._cache_summaries and (now_ts - cls._cache_summaries_time) < cls.CACHE_TTL_SECONDS:
            return cls._cache_summaries

        all_syms = symbols or SymbolRegistryService.get_monitored_symbols_from_db()
        priority = ["TATASIL", "NIFTY50", "RELIANCE", "TCS", "AAPL", "NVDA", "IONQ", "GOLDBEES", "NIFTYBEES", "BANKNIFTY"]
        ordered_syms: List[str] = []
        for p in priority:
            if p in all_syms and p not in ordered_syms:
                ordered_syms.append(p)
            elif p in SymbolRegistryService.ALIASES and p not in ordered_syms:
                ordered_syms.append(p)
        for s in all_syms:
            if s not in ordered_syms:
                ordered_syms.append(s)

        target_symbols = ordered_syms[:20]

        def _fetch_one(sym: str) -> Optional[StockSummary]:
            try:
                if sym in cls._cache_details and (now_ts - cls._cache_details[sym]["time"]) < cls.CACHE_TTL_SECONDS:
                    detail = cls._cache_details[sym]["data"]
                else:
                    detail = cls.fetch_live_stock_detail(sym)

                return StockSummary(
                    symbol=detail.symbol,
                    name=detail.name,
                    category=detail.category,
                    exchange=detail.exchange,
                    current_price=detail.current_price,
                    change_amount=detail.change_amount,
                    change_pct=detail.change_pct,
                    currency=detail.currency,
                    volume_24h=detail.volume_24h,
                    market_cap=detail.market_cap,
                    sparkline=detail.sparkline,
                    morning_signal=detail.morning_signal,
                    previous_close=detail.previous_close,
                    today_open=detail.today_open
                )
            except Exception as e:
                logger.warning(f"Could not load live summary for {sym}: {e}")
                return None

        summaries_map: Dict[str, StockSummary] = {}
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_sym = {executor.submit(_fetch_one, sym): sym for sym in target_symbols}
            for future in as_completed(future_to_sym):
                res = future.result()
                if res:
                    summaries_map[res.symbol] = res

        ordered_summaries = [summaries_map[s] for s in target_symbols if s in summaries_map]

        if ordered_summaries:
            cls._cache_summaries = ordered_summaries
            cls._cache_summaries_time = now_ts
        return ordered_summaries
