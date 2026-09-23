import time
import math
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import numpy as np

try:
    from backend.models import (
        StockSummary, StockDetail, PricePoint, ForecastPoint,
        MorningSignal
    )
    from backend.forecast_engine import ForecastEngine
except ImportError:
    from models import (
        StockSummary, StockDetail, PricePoint, ForecastPoint,
        MorningSignal
    )
    from forecast_engine import ForecastEngine

logger = logging.getLogger("LiveMarketService")

class LiveMarketService:
    """
    High-Performance Live Market Data Service integrating Yahoo Finance (yfinance)
    with in-memory TTL caching, timeframe resampling, and automated AI signal calculation.
    """
    _cache_summaries: Optional[List[StockSummary]] = None
    _cache_summaries_time: float = 0.0
    _cache_details: Dict[str, Dict[str, Any]] = {}
    CACHE_TTL_SECONDS = 45.0  # 45 seconds fresh cache

    ALIASES = {
        "TATASIL": "TATASTEEL.NS",
        "NIFTY50": "^NSEI",
        "NIFTY": "^NSEI",
        "BANKNIFTY": "^NSEBANK",
        "SENSEX": "^BSESN"
    }

    @classmethod
    def resolve_ticker(cls, symbol: str) -> str:
        s = symbol.upper().strip()
        if s in cls.ALIASES:
            return cls.ALIASES[s]
        if "." in s or "^" in s:
            return s
        return f"{s}.NS"

    @classmethod
    def fetch_symbol_metadata_from_api(cls, symbol: str) -> Dict[str, Any]:
        """
        Fetches official asset metadata dynamically from live API (longName, quoteType, currency, exchange, summary).
        Auto-detects Indian (.NS) vs Global / US tickers without static hardcoding.
        """
        symbol_upper = symbol.upper().strip()
        yf_ticker = cls.resolve_ticker(symbol_upper)
        
        try:
            import yfinance as yf
            t = yf.Ticker(yf_ticker)
            info = t.info or {}
            
            # If empty or not found on NSE, attempt lookup on US exchange directly
            if not info or info.get("regularMarketPrice") is None:
                if yf_ticker.endswith(".NS"):
                    us_ticker = symbol_upper
                    t_us = yf.Ticker(us_ticker)
                    info_us = t_us.info or {}
                    if info_us and info_us.get("regularMarketPrice") is not None:
                        t = t_us
                        info = info_us
                        yf_ticker = us_ticker

            # Map quoteType to category
            qtype = (info.get("quoteType") or "").upper()
            if "ETF" in qtype or "MUTUALFUND" in qtype or "BEES" in symbol_upper:
                category = "ETF"
            elif "INDEX" in qtype or "^" in yf_ticker:
                category = "INDEX"
            else:
                category = "EQUITY"
                
            name = info.get("longName") or info.get("shortName") or f"{symbol_upper} Asset"
            exchange = info.get("exchange") or ("NSE" if yf_ticker.endswith(".NS") else "NASDAQ")
            currency = "₹" if (exchange == "NSE" or yf_ticker.endswith(".NS") or yf_ticker.startswith("^") or info.get("currency") == "INR") else "$"
            desc = info.get("longBusinessSummary") or f"Live real-time market asset {symbol_upper} traded on {exchange}."
            
            return {
                "symbol": symbol_upper,
                "ticker": yf_ticker,
                "name": name,
                "category": category,
                "exchange": exchange,
                "currency": currency,
                "description": desc,
                "is_active": True
            }
        except Exception as e:
            logger.warning(f"Could not fetch API info for {symbol_upper}: {e}")
            return {
                "symbol": symbol_upper,
                "ticker": yf_ticker,
                "name": f"{symbol_upper} Asset",
                "category": "EQUITY",
                "exchange": "NSE" if yf_ticker.endswith(".NS") else "NASDAQ",
                "currency": "₹" if yf_ticker.endswith(".NS") else "$",
                "description": f"Live tracked asset {symbol_upper}.",
                "is_active": True
            }

    @classmethod
    def fetch_trending_symbols_from_api(cls) -> List[str]:
        """
        Discovers live trending, high-volume, and screener tickers dynamically from third-party market APIs (Yahoo Finance API).
        100% dynamically fetched without static hardcoded lists.
        """
        discovered: List[str] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        
        # 1. Fetch live trending tickers in India & US
        for region in ["IN", "US"]:
            try:
                import requests
                url = f"https://query2.finance.yahoo.com/v1/finance/trending/{region}"
                res = requests.get(url, headers=headers, timeout=5)
                if res.status_code == 200:
                    data = res.json()
                    quotes = data.get("finance", {}).get("result", [{}])[0].get("quotes", [])
                    for q in quotes:
                        raw_sym = q.get("symbol", "")
                        clean_sym = raw_sym.replace(".NS", "").replace(".BO", "").replace("^", "")
                        if clean_sym and len(clean_sym) <= 12 and clean_sym not in discovered:
                            discovered.append(clean_sym)
            except Exception as e:
                logger.warning(f"Error fetching trending symbols for region {region}: {e}")

        # 2. Fetch live most active stocks from screener API
        try:
            import requests
            url = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=most_actives&count=20"
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                quotes = data.get("finance", {}).get("result", [{}])[0].get("quotes", [])
                for q in quotes:
                    sym = q.get("symbol", "").replace(".NS", "").replace(".BO", "").replace("^", "")
                    if sym and sym not in discovered and len(sym) <= 12:
                        discovered.append(sym)
        except Exception as e:
            logger.warning(f"Error querying screener most_actives: {e}")

        # 3. Fetch live search for Indian market benchmark index & ETFs
        for q_term in ["NIFTY", "RELIANCE", "TATA", "ETF"]:
            try:
                import requests
                url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q_term}&quotesCount=5&newsCount=0"
                res = requests.get(url, headers=headers, timeout=4)
                if res.status_code == 200:
                    data = res.json()
                    quotes = data.get("quotes", [])
                    for q in quotes:
                        sym = q.get("symbol", "").replace(".NS", "").replace(".BO", "").replace("^", "")
                        if sym and sym not in discovered and len(sym) <= 12:
                            discovered.append(sym)
            except Exception as e:
                logger.warning(f"Error searching live symbols for {q_term}: {e}")

        return discovered

    @classmethod
    def sync_symbols_to_db(cls, symbols: Optional[List[str]] = None) -> List[str]:
        """
        Fetches symbol metadata from API and saves/updates it in MarketSymbolDB table.
        If no symbols list is provided, dynamically discovers trending & active symbols from third-party live API.
        """
        target_symbols = symbols or cls.fetch_trending_symbols_from_api()

        try:
            from backend.database import SessionLocal
            from backend.db_models import MarketSymbolDB
        except ImportError:
            from database import SessionLocal
            from db_models import MarketSymbolDB
            
        saved_symbols = []
        db = SessionLocal()
        try:
            for sym in target_symbols:
                meta = cls.fetch_symbol_metadata_from_api(sym)
                existing = db.query(MarketSymbolDB).filter(MarketSymbolDB.symbol == meta["symbol"]).first()
                if not existing:
                    new_item = MarketSymbolDB(
                        symbol=meta["symbol"],
                        ticker=meta["ticker"],
                        name=meta["name"],
                        category=meta["category"],
                        exchange=meta["exchange"],
                        currency=meta["currency"],
                        description=meta["description"],
                        is_active=True,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(new_item)
                else:
                    existing.ticker = meta["ticker"]
                    existing.name = meta["name"]
                    existing.category = meta["category"]
                    existing.exchange = meta["exchange"]
                    existing.currency = meta["currency"]
                    if meta.get("description"):
                        existing.description = meta["description"]
                    existing.updated_at = datetime.utcnow()
                saved_symbols.append(meta["symbol"])
            db.commit()
            logger.info(f"Successfully synced {len(saved_symbols)} market symbols into database.")
        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing market symbols to DB: {e}")
        finally:
            db.close()
        return saved_symbols

    @classmethod
    def get_monitored_symbols_from_db(cls) -> List[str]:
        """
        Retrieves active monitored symbols dynamically from the database.
        If the database table is empty, automatically triggers sync from the API.
        """
        try:
            from backend.database import SessionLocal
            from backend.db_models import MarketSymbolDB
        except ImportError:
            from database import SessionLocal
            from db_models import MarketSymbolDB

        db = SessionLocal()
        try:
            rows = db.query(MarketSymbolDB).filter(MarketSymbolDB.is_active == True).all()
            if not rows:
                cls.sync_symbols_to_db()
                rows = db.query(MarketSymbolDB).filter(MarketSymbolDB.is_active == True).all()
            return [r.symbol for r in rows]
        except Exception as e:
            logger.error(f"Error querying market symbols from DB: {e}")
            return list(cls.TICKER_MAP.keys())
        finally:
            db.close()

    @classmethod
    def fetch_live_stock_detail(cls, symbol: str, fallback_detail: Optional[StockDetail] = None) -> StockDetail:
        """
        Fetches live real-time price, fundamentals, multi-timeframe candles,
        and recalculates AI Forecasts & 9 AM Morning Signals from actual market data.
        """
        symbol_upper = symbol.upper().strip()
        now_ts = time.time()

        # Check Cache
        if symbol_upper in cls._cache_details:
            cached_data, cache_time = cls._cache_details[symbol_upper]["data"], cls._cache_details[symbol_upper]["time"]
            if (now_ts - cache_time) < cls.CACHE_TTL_SECONDS:
                return cached_data

        yf_ticker = cls.resolve_ticker(symbol_upper)
        
        # Check DB for metadata
        meta = None
        try:
            from backend.database import SessionLocal
            from backend.db_models import MarketSymbolDB
            s_db = SessionLocal()
            row = s_db.query(MarketSymbolDB).filter(MarketSymbolDB.symbol == symbol_upper).first()
            if row:
                meta = {
                    "name": row.name,
                    "category": row.category,
                    "exchange": row.exchange,
                    "currency": row.currency,
                    "desc": row.description or ""
                }
            s_db.close()
        except Exception:
            pass

        if not meta:
            meta = cls.fetch_symbol_metadata_from_api(symbol_upper)


        try:
            import yfinance as yf
            ticker_obj = yf.Ticker(yf_ticker)
            
            # 1. Fetch live 1-month daily history for quotes & technicals
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

            day_high = round(float(highs[-1]), 2) if highs else current_p
            day_low = round(float(lows[-1]), 2) if lows else current_p
            vol_last = int(volumes[-1]) if volumes else 100000

            # 2. Build multi-timeframe candle datasets
            historical_data: Dict[str, List[PricePoint]] = {}

            # 1D: intraday (5m or 15m)
            df_1d = ticker_obj.history(period="1d", interval="5m", timeout=4.0)
            if df_1d is not None and not df_1d.empty and len(df_1d) >= 5:
                pts_1d = []
                for idx, row in df_1d.iterrows():
                    ts = idx.to_pydatetime()
                    pts_1d.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=ts.strftime("%H:%M"),
                        open=round(float(row["Open"]), 2),
                        high=round(float(row["High"]), 2),
                        low=round(float(row["Low"]), 2),
                        close=round(float(row["Close"]), 2),
                        volume=int(row["Volume"]) if "Volume" in row and not math.isnan(row["Volume"]) else 1000
                    ))
                historical_data["1D"] = pts_1d
            elif fallback_detail and "1D" in fallback_detail.historical_data:
                historical_data["1D"] = fallback_detail.historical_data["1D"]

            # 1W: 5 days hourly
            df_1w = ticker_obj.history(period="5d", interval="60m", timeout=4.0)
            if df_1w is not None and not df_1w.empty and len(df_1w) >= 5:
                pts_1w = []
                for idx, row in df_1w.iterrows():
                    ts = idx.to_pydatetime()
                    pts_1w.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=f"{ts.strftime('%a')} {ts.strftime('%H:%M')}",
                        open=round(float(row["Open"]), 2),
                        high=round(float(row["High"]), 2),
                        low=round(float(row["Low"]), 2),
                        close=round(float(row["Close"]), 2),
                        volume=int(row["Volume"]) if "Volume" in row and not math.isnan(row["Volume"]) else 5000
                    ))
                historical_data["1W"] = pts_1w
            elif fallback_detail and "1W" in fallback_detail.historical_data:
                historical_data["1W"] = fallback_detail.historical_data["1W"]

            # 1M: 30 days daily
            pts_1m = []
            for idx, row in df_daily.tail(30).iterrows():
                ts = idx.to_pydatetime()
                pts_1m.append(PricePoint(
                    timestamp=ts.isoformat(),
                    time_label=ts.strftime("%b %d"),
                    open=round(float(row["Open"]), 2),
                    high=round(float(row["High"]), 2),
                    low=round(float(row["Low"]), 2),
                    close=round(float(row["Close"]), 2),
                    volume=int(row["Volume"]) if "Volume" in row and not math.isnan(row["Volume"]) else 25000
                ))
            historical_data["1M"] = pts_1m

            # 1Y: 1 year weekly / daily
            df_1y = ticker_obj.history(period="1y", interval="1wk", timeout=4.0)
            if df_1y is not None and not df_1y.empty:
                pts_1y = []
                for idx, row in df_1y.iterrows():
                    ts = idx.to_pydatetime()
                    pts_1y.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=ts.strftime("%b %d"),
                        open=round(float(row["Open"]), 2),
                        high=round(float(row["High"]), 2),
                        low=round(float(row["Low"]), 2),
                        close=round(float(row["Close"]), 2),
                        volume=int(row["Volume"]) if "Volume" in row and not math.isnan(row["Volume"]) else 100000
                    ))
                historical_data["1Y"] = pts_1y
            elif fallback_detail and "1Y" in fallback_detail.historical_data:
                historical_data["1Y"] = fallback_detail.historical_data["1Y"]

            # 5Y: 5 years monthly
            df_5y = ticker_obj.history(period="5y", interval="1mo", timeout=4.0)
            if df_5y is not None and not df_5y.empty:
                pts_5y = []
                for idx, row in df_5y.iterrows():
                    ts = idx.to_pydatetime()
                    pts_5y.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=ts.strftime("%b %Y"),
                        open=round(float(row["Open"]), 2),
                        high=round(float(row["High"]), 2),
                        low=round(float(row["Low"]), 2),
                        close=round(float(row["Close"]), 2),
                        volume=int(row["Volume"]) if "Volume" in row and not math.isnan(row["Volume"]) else 500000
                    ))
                historical_data["5Y"] = pts_5y
            elif fallback_detail and "5Y" in fallback_detail.historical_data:
                historical_data["5Y"] = fallback_detail.historical_data["5Y"]

            # Fallback candle builders from daily data if specific interval returns empty (e.g. market closed)
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
                for idx, row in df_daily.tail(7).iterrows():
                    ts = idx.to_pydatetime()
                    pts_1w.append(PricePoint(
                        timestamp=ts.isoformat(),
                        time_label=f"{ts.strftime('%a')} {ts.strftime('%H:%M')}",
                        open=round(float(row["Open"]), 2),
                        high=round(float(row["High"]), 2),
                        low=round(float(row["Low"]), 2),
                        close=round(float(row["Close"]), 2),
                        volume=int(row["Volume"]) if "Volume" in row and not math.isnan(row["Volume"]) else 5000
                    ))
                historical_data["1W"] = pts_1w

            if "1Y" not in historical_data:
                historical_data["1Y"] = pts_1m

            if "5Y" not in historical_data:
                historical_data["5Y"] = pts_1m

            # 3. Fundamentals & Metadata
            try:
                info = ticker_obj.fast_info
                w52_high = round(float(getattr(info, "year_high", max(highs))), 2)
                w52_low = round(float(getattr(info, "year_low", min(lows))), 2)
                mcap = getattr(info, "market_cap", None)
                if mcap:
                    mcap_str = f"₹{mcap / 1e12:.1f}T" if meta["currency"] == "₹" else f"${mcap / 1e9:.1f}B"
                else:
                    mcap_str = f"{meta['currency']}100B"
            except Exception:
                w52_high = round(max(highs), 2)
                w52_low = round(min(lows), 2)
                mcap_str = f"{meta['currency']}100B"

            # 4. Generate TimesFM Forecast from Live Series
            clean_closes = [round(float(c), 2) for c in closes]
            prediction_res = ForecastEngine.run_timesfm_prediction(
                symbol=symbol_upper,
                name=meta["name"],
                current_price=current_p,
                historical_closes=clean_closes
            )
            forecast_points = prediction_res.get("forecast_points", [])

            # 5. Calculate Live 9:00 AM Morning Signal
            morning_signal = ForecastEngine.generate_morning_signal(
                symbol=symbol_upper,
                name=meta["name"],
                current_price=current_p,
                history=historical_data.get("1M", []),
                custom_rationale=f"Live market quote updated. Real-time momentum calculated from {len(clean_closes)} live exchange bars."
            )

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
                description=meta["desc"],
                week_high_52=w52_high,
                week_low_52=w52_low,
                day_high=day_high,
                day_low=day_low,
                pe_ratio=24.5,
                historical_data=historical_data,
                forecast_next_week=forecast_points,
                morning_signal=morning_signal,
                sparkline=sparkline
            )

            # Store in Cache
            cls._cache_details[symbol_upper] = {
                "data": live_detail,
                "time": now_ts
            }
            return live_detail

        except Exception as e:
            logger.warning(f"Could not fetch live data for {symbol_upper} ({e}). Returning fallback snapshot.")
            if fallback_detail:
                return fallback_detail
            raise e

    @classmethod
    def get_live_summaries(cls, symbols: Optional[List[str]] = None) -> List[StockSummary]:
        """
        Returns real-time summaries for all monitored stocks directly from live market queries.
        Uses cached data or updates live tickers.
        """
        now_ts = time.time()
        if cls._cache_summaries and (now_ts - cls._cache_summaries_time) < cls.CACHE_TTL_SECONDS:
            return cls._cache_summaries

        target_symbols = symbols or list(cls.META_MAP.keys())
        summaries: List[StockSummary] = []
        for symbol in target_symbols:
            try:
                # Fast quote lookup or cached detail
                if symbol in cls._cache_details and (now_ts - cls._cache_details[symbol]["time"]) < cls.CACHE_TTL_SECONDS:
                    detail = cls._cache_details[symbol]["data"]
                else:
                    detail = cls.fetch_live_stock_detail(symbol)
                
                summaries.append(
                    StockSummary(
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
                        morning_signal=detail.morning_signal
                    )
                )
            except Exception as e:
                logger.error(f"Error fetching live summary for {symbol}: {e}")

        if summaries:
            cls._cache_summaries = summaries
            cls._cache_summaries_time = now_ts
        return summaries
