import json
import os
import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
try:
    from backend.models import (
        StockSummary, StockDetail, PricePoint, ForecastPoint,
        MorningSignal, UserProfile, PortfolioPosition, PortfolioSummary
    )
    from backend.forecast_engine import ForecastEngine
except ImportError:
    from models import (
        StockSummary, StockDetail, PricePoint, ForecastPoint,
        MorningSignal, UserProfile, PortfolioPosition, PortfolioSummary
    )
    from forecast_engine import ForecastEngine

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
STOCKS_FILE = os.path.join(DATA_DIR, "stocks.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
PORTFOLIO_FILE = os.path.join(DATA_DIR, "portfolio.json")

class DataStore:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.stocks: Dict[str, StockDetail] = {}
        self.users: Dict[str, UserProfile] = {}
        self.portfolio_positions: Dict[str, List[PortfolioPosition]] = {}
        self._load_or_initialize_data()

    def _generate_timeframe_data(self, base_price: float, volatility: float, trend_dir: float) -> Dict[str, List[PricePoint]]:
        now = datetime.now()
        data: Dict[str, List[PricePoint]] = {}

        # 1D: 9:15 AM to 3:30 PM (75 intervals of ~5 mins)
        day_points = []
        cur_p = base_price * (1 - 0.008 * trend_dir)
        start_trade = now.replace(hour=9, minute=15, second=0, microsecond=0)
        for i in range(75):
            t = start_trade + timedelta(minutes=i * 5)
            fluctuation = random.uniform(-0.003, 0.003) + (0.00015 * trend_dir)
            cur_p = max(cur_p * (1 + fluctuation), 1.0)
            high = cur_p * (1 + random.uniform(0.0005, 0.002))
            low = cur_p * (1 - random.uniform(0.0005, 0.002))
            op = cur_p * (1 + random.uniform(-0.001, 0.001))
            vol = random.randint(1500, 15000)
            day_points.append(
                PricePoint(
                    timestamp=t.isoformat(),
                    time_label=t.strftime("%H:%M"),
                    open=round(op, 2),
                    high=round(high, 2),
                    low=round(low, 2),
                    close=round(cur_p, 2),
                    volume=vol
                )
            )
        data["1D"] = day_points

        # 1W: 7 days, 5 data points per day (35 points)
        week_points = []
        cur_p = base_price * (1 - 0.02 * trend_dir)
        for d in range(7, 0, -1):
            day_date = now - timedelta(days=d)
            for h in [10, 11, 13, 14, 15]:
                t = day_date.replace(hour=h, minute=0, second=0)
                cur_p = max(cur_p * (1 + random.uniform(-0.008, 0.008) + (0.001 * trend_dir)), 1.0)
                week_points.append(
                    PricePoint(
                        timestamp=t.isoformat(),
                        time_label=f"{day_date.strftime('%a')} {h}:00",
                        open=round(cur_p * 0.999, 2),
                        high=round(cur_p * 1.004, 2),
                        low=round(cur_p * 0.996, 2),
                        close=round(cur_p, 2),
                        volume=random.randint(25000, 120000)
                    )
                )
        data["1W"] = week_points

        # 1M: 30 daily points
        month_points = []
        cur_p = base_price * (1 - 0.05 * trend_dir)
        for d in range(30, 0, -1):
            day_date = now - timedelta(days=d)
            cur_p = max(cur_p * (1 + random.uniform(-0.015, 0.015) + (0.002 * trend_dir)), 1.0)
            month_points.append(
                PricePoint(
                    timestamp=day_date.isoformat(),
                    time_label=day_date.strftime("%b %d"),
                    open=round(cur_p * 0.995, 2),
                    high=round(cur_p * 1.015, 2),
                    low=round(cur_p * 0.985, 2),
                    close=round(cur_p, 2),
                    volume=random.randint(150000, 850000)
                )
            )
        data["1M"] = month_points

        # 1Y: 52 weekly points
        year_points = []
        cur_p = base_price * (1 - 0.18 * trend_dir)
        for w in range(52, 0, -1):
            week_date = now - timedelta(weeks=w)
            cur_p = max(cur_p * (1 + random.uniform(-0.025, 0.025) + (0.004 * trend_dir)), 1.0)
            year_points.append(
                PricePoint(
                    timestamp=week_date.isoformat(),
                    time_label=week_date.strftime("%b '%y"),
                    open=round(cur_p * 0.99, 2),
                    high=round(cur_p * 1.03, 2),
                    low=round(cur_p * 0.97, 2),
                    close=round(cur_p, 2),
                    volume=random.randint(1200000, 4500000)
                )
            )
        data["1Y"] = year_points

        # 5Y: 60 monthly points
        five_year_points = []
        cur_p = base_price * (0.45 if trend_dir > 0 else 1.3)
        for m in range(60, 0, -1):
            month_date = now - timedelta(days=m * 30.4)
            cur_p = max(cur_p * (1 + random.uniform(-0.04, 0.05) + (0.008 * trend_dir)), 1.0)
            five_year_points.append(
                PricePoint(
                    timestamp=month_date.isoformat(),
                    time_label=month_date.strftime("%b %Y"),
                    open=round(cur_p * 0.98, 2),
                    high=round(cur_p * 1.06, 2),
                    low=round(cur_p * 0.94, 2),
                    close=round(cur_p, 2),
                    volume=random.randint(5000000, 22000000)
                )
            )
        data["5Y"] = five_year_points

        return data

    def _load_or_initialize_data(self):
        # 1. Stocks definitions with special focus on TataSil ETF
        initial_stocks = [
            {
                "symbol": "TATASIL",
                "name": "Tata Steel ETF / Index Fund",
                "category": "ETF",
                "exchange": "NSE",
                "current_price": 164.50,
                "change_amount": 3.85,
                "change_pct": 2.40,
                "currency": "₹",
                "volume_24h": "18.4M",
                "market_cap": "₹205.8B",
                "description": "Tata Steel ETF tracks the domestic and international steel commodity momentum, metal sector heavyweights, infrastructure expansion demand, and Tata Steel value chain performance.",
                "week_high_52": 184.60,
                "week_low_52": 114.20,
                "day_high": 166.20,
                "day_low": 161.10,
                "pe_ratio": 14.8,
                "trend_dir": 1.2,
                "rationale": "Bullish breakout above ₹162 resistance on strong metal index volume. Pre-market export duty incentives and infrastructure capital expenditure cycle favor steel upside."
            },
            {
                "symbol": "NIFTY50",
                "name": "NIFTY 50 Benchmark Index",
                "category": "INDEX",
                "exchange": "NSE",
                "current_price": 25380.00,
                "change_amount": 142.50,
                "change_pct": 0.56,
                "currency": "₹",
                "volume_24h": "340M",
                "market_cap": "₹3.8T",
                "description": "The flagship benchmark Indian equity market index representing the weighted average of 50 of the largest Indian companies across key economic sectors.",
                "week_high_52": 26277.35,
                "week_low_52": 21280.45,
                "day_high": 25440.00,
                "day_low": 25260.00,
                "pe_ratio": 22.4,
                "trend_dir": 0.8,
                "rationale": "Consistent pre-market institutional DII buying support. Key moving averages indicate continuation toward 25,600 target."
            },
            {
                "symbol": "RELIANCE",
                "name": "Reliance Industries Ltd",
                "category": "EQUITY",
                "exchange": "NSE",
                "current_price": 2985.40,
                "change_amount": 28.60,
                "change_pct": 0.97,
                "currency": "₹",
                "volume_24h": "6.2M",
                "market_cap": "₹20.2T",
                "description": "Conglomerate with market leadership in telecommunications (Jio), retail, clean energy innovations, and petrochemical refining.",
                "week_high_52": 3217.90,
                "week_low_52": 2220.30,
                "day_high": 3004.00,
                "day_low": 2960.50,
                "pe_ratio": 27.1,
                "trend_dir": 0.9,
                "rationale": "Positive green hydrogen announcements and telecom ARPU expansion create strong 9:00 AM BUY signal."
            },
            {
                "symbol": "TCS",
                "name": "Tata Consultancy Services",
                "category": "EQUITY",
                "exchange": "NSE",
                "current_price": 4210.00,
                "change_amount": -18.50,
                "change_pct": -0.44,
                "currency": "₹",
                "volume_24h": "2.8M",
                "market_cap": "₹15.2T",
                "description": "Global leader in IT services, consulting, and business solutions delivering large-scale enterprise digital transformation.",
                "week_high_52": 4585.00,
                "week_low_52": 3310.00,
                "day_high": 4245.00,
                "day_low": 4190.00,
                "pe_ratio": 30.5,
                "trend_dir": 0.2,
                "rationale": "Holding pattern near 50-day SMA. Await BFSI quarterly deal total contract value updates."
            },
            {
                "symbol": "GOLDBEES",
                "name": "Nippon India ETF Gold BeES",
                "category": "ETF",
                "exchange": "NSE",
                "current_price": 68.45,
                "change_amount": 0.72,
                "change_pct": 1.06,
                "currency": "₹",
                "volume_24h": "24.5M",
                "market_cap": "₹145B",
                "description": "Open-ended exchange traded fund designed to track domestic physical spot gold prices with high liquidity.",
                "week_high_52": 72.80,
                "week_low_52": 52.10,
                "day_high": 68.90,
                "day_low": 67.80,
                "pe_ratio": None,
                "trend_dir": 1.1,
                "rationale": "Global central bank reserve buying and safe-haven demand trigger 9 AM Strong Buy recommendation."
            },
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "category": "EQUITY",
                "exchange": "NASDAQ",
                "current_price": 228.30,
                "change_amount": 3.40,
                "change_pct": 1.51,
                "currency": "$",
                "volume_24h": "48.2M",
                "market_cap": "$3.48T",
                "description": "Global consumer technology pioneer specializing in iPhone, Mac, Apple Intelligence AI ecosystem, and cloud services.",
                "week_high_52": 237.23,
                "week_low_52": 164.08,
                "day_high": 229.80,
                "day_low": 224.50,
                "pe_ratio": 34.2,
                "trend_dir": 1.0,
                "rationale": "Apple Intelligence rollout adoption surpassing forecasts. Pre-market upgrades from top Wall Street analysts."
            },
            {
                "symbol": "TSLA",
                "name": "Tesla Inc.",
                "category": "EQUITY",
                "exchange": "NASDAQ",
                "current_price": 254.10,
                "change_amount": -5.20,
                "change_pct": -2.01,
                "currency": "$",
                "volume_24h": "64.8M",
                "market_cap": "$810B",
                "description": "Electric vehicle manufacturing, full self-driving (FSD) autonomy, robotaxi platforms, and megapack battery energy storage.",
                "week_high_52": 271.00,
                "week_low_52": 138.80,
                "day_high": 261.00,
                "day_low": 251.30,
                "pe_ratio": 62.8,
                "trend_dir": -0.5,
                "rationale": "Near term resistance test failed. Morning AI signal suggests taking profit / Sell ahead of regulatory review."
            },
            {
                "symbol": "SILVERBEES",
                "name": "Nippon India ETF Silver BeES",
                "category": "ETF",
                "exchange": "NSE",
                "current_price": 89.20,
                "change_amount": 1.95,
                "change_pct": 2.23,
                "currency": "₹",
                "volume_24h": "12.3M",
                "market_cap": "₹68B",
                "description": "Exchange traded fund tracking domestic silver prices, benefiting from solar PV manufacturing and industrial demand.",
                "week_high_52": 96.50,
                "week_low_52": 66.80,
                "day_high": 89.80,
                "day_low": 87.40,
                "pe_ratio": None,
                "trend_dir": 1.4,
                "rationale": "Industrial green energy demand surge and pre-market physical premium expansion trigger Strong Buy."
            }
        ]

        for s in initial_stocks:
            hist = self._generate_timeframe_data(s["current_price"], volatility=0.015, trend_dir=s["trend_dir"])
            # Generate sparkline from last 15 points of 1D
            sparkline = [p.close for p in hist["1D"][-15:]]
            
            # Generate 7-day forecast
            forecast_7d = ForecastEngine.generate_next_week_forecast(
                base_price=s["current_price"],
                historical_close_prices=[p.close for p in hist["1M"]],
                volatility_factor=0.018,
                bias=0.006 * s["trend_dir"]
            )
            
            # Generate 9:00 AM Morning AI signal
            morning_sig = ForecastEngine.generate_morning_signal(
                symbol=s["symbol"],
                name=s["name"],
                current_price=s["current_price"],
                history=hist["1M"],
                custom_rationale=s.get("rationale")
            )

            detail = StockDetail(
                symbol=s["symbol"],
                name=s["name"],
                category=s["category"],
                exchange=s["exchange"],
                current_price=s["current_price"],
                change_amount=s["change_amount"],
                change_pct=s["change_pct"],
                currency=s["currency"],
                volume_24h=s["volume_24h"],
                market_cap=s["market_cap"],
                sparkline=sparkline,
                description=s["description"],
                week_high_52=s["week_high_52"],
                week_low_52=s["week_low_52"],
                day_high=s["day_high"],
                day_low=s["day_low"],
                pe_ratio=s.get("pe_ratio"),
                historical_data=hist,
                forecast_next_week=forecast_7d,
                morning_signal=morning_sig
            )
            self.stocks[s["symbol"]] = detail

        # 2. Seed Default Demo User
        demo_user = UserProfile(
            id="usr_demo_01",
            username="trader_pro",
            email="trader@tradeai.app",
            full_name="Alex Vance",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            risk_tolerance="AGGRESSIVE",
            morning_alert_time="08:30 AM",
            enable_push_notifications=True,
            watchlist=["TATASIL", "NIFTY50", "RELIANCE", "AAPL", "GOLDBEES"]
        )
        self.users[demo_user.id] = demo_user

        # 3. Seed Portfolio for demo user
        self.portfolio_positions[demo_user.id] = [
            PortfolioPosition(
                id="pos_1",
                symbol="TATASIL",
                name="Tata Steel ETF / Index Fund",
                shares=250.0,
                average_buy_price=152.00,
                current_price=164.50,
                invested_amount=38000.0,
                current_value=41125.0,
                unrealized_pnl=3125.0,
                unrealized_pnl_pct=8.22,
                buy_date="2026-08-15"
            ),
            PortfolioPosition(
                id="pos_2",
                symbol="RELIANCE",
                name="Reliance Industries Ltd",
                shares=15.0,
                average_buy_price=2890.00,
                current_price=2985.40,
                invested_amount=43350.0,
                current_value=44781.0,
                unrealized_pnl=1431.0,
                unrealized_pnl_pct=3.30,
                buy_date="2026-09-01"
            ),
            PortfolioPosition(
                id="pos_3",
                symbol="GOLDBEES",
                name="Nippon India ETF Gold BeES",
                shares=300.0,
                average_buy_price=64.10,
                current_price=68.45,
                invested_amount=19230.0,
                current_value=20535.0,
                unrealized_pnl=1305.0,
                unrealized_pnl_pct=6.79,
                buy_date="2026-07-20"
            )
        ]

    def get_all_summaries(self) -> List[StockSummary]:
        summaries = []
        for stock in self.stocks.values():
            summaries.append(
                StockSummary(
                    symbol=stock.symbol,
                    name=stock.name,
                    category=stock.category,
                    exchange=stock.exchange,
                    current_price=stock.current_price,
                    change_amount=stock.change_amount,
                    change_pct=stock.change_pct,
                    currency=stock.currency,
                    volume_24h=stock.volume_24h,
                    market_cap=stock.market_cap,
                    sparkline=stock.sparkline,
                    morning_signal=stock.morning_signal
                )
            )
        return summaries

    def get_stock_detail(self, symbol: str) -> Optional[StockDetail]:
        return self.stocks.get(symbol.upper())

    def search_stocks(self, query: str) -> List[StockSummary]:
        q = query.lower()
        results = []
        for stock in self.stocks.values():
            if q in stock.symbol.lower() or q in stock.name.lower() or q in stock.category.lower():
                results.append(
                    StockSummary(
                        symbol=stock.symbol,
                        name=stock.name,
                        category=stock.category,
                        exchange=stock.exchange,
                        current_price=stock.current_price,
                        change_amount=stock.change_amount,
                        change_pct=stock.change_pct,
                        currency=stock.currency,
                        volume_24h=stock.volume_24h,
                        market_cap=stock.market_cap,
                        sparkline=stock.sparkline,
                        morning_signal=stock.morning_signal
                    )
                )
        return results

    def get_morning_signals(self) -> List[MorningSignal]:
        signals = []
        for stock in self.stocks.values():
            if stock.morning_signal:
                signals.append(stock.morning_signal)
        # Sort by confidence descending
        signals.sort(key=lambda s: s.confidence, reverse=True)
        return signals

    def get_portfolio_summary(self, user_id: str) -> PortfolioSummary:
        positions = self.portfolio_positions.get(user_id, [])
        # Recalculate with live stock prices
        updated_positions = []
        total_inv = 0.0
        total_curr = 0.0
        
        for pos in positions:
            stock = self.stocks.get(pos.symbol)
            live_price = stock.current_price if stock else pos.current_price
            curr_val = round(pos.shares * live_price, 2)
            inv_val = round(pos.shares * pos.average_buy_price, 2)
            pnl = round(curr_val - inv_val, 2)
            pnl_pct = round((pnl / inv_val * 100.0) if inv_val > 0 else 0.0, 2)
            
            updated_pos = PortfolioPosition(
                id=pos.id,
                symbol=pos.symbol,
                name=pos.name,
                shares=pos.shares,
                average_buy_price=pos.average_buy_price,
                current_price=live_price,
                invested_amount=inv_val,
                current_value=curr_val,
                unrealized_pnl=pnl,
                unrealized_pnl_pct=pnl_pct,
                buy_date=pos.buy_date
            )
            updated_positions.append(updated_pos)
            total_inv += inv_val
            total_curr += curr_val

        total_pnl = round(total_curr - total_inv, 2)
        total_pnl_pct = round((total_pnl / total_inv * 100.0) if total_inv > 0 else 0.0, 2)

        return PortfolioSummary(
            total_invested=round(total_inv, 2),
            total_current_value=round(total_curr, 2),
            total_pnl=total_pnl,
            total_pnl_pct=total_pnl_pct,
            positions=updated_positions
        )

# Global singleton repository instance
db = DataStore()
