import os
import json
import logging
from typing import Dict, List, Optional, Any
try:
    from backend.models import (
        StockSummary, StockDetail, PricePoint, ForecastPoint,
        MorningSignal, UserProfile, PortfolioPosition, PortfolioSummary
    )
    from backend.live_market_service import LiveMarketService
except ImportError:
    from models import (
        StockSummary, StockDetail, PricePoint, ForecastPoint,
        MorningSignal, UserProfile, PortfolioPosition, PortfolioSummary
    )
    from live_market_service import LiveMarketService

logger = logging.getLogger("DataStore")

class DataStore:
    """
    Dynamic in-memory & live repository for TradeAI.
    All stock quotes, multi-timeframe candles, TimesFM predictions,
    and 9:00 AM morning signals are fetched 100% dynamically via LiveMarketService.
    """
    def __init__(self):
        self.users: Dict[str, UserProfile] = {}
        self.portfolio_positions: Dict[str, List[PortfolioPosition]] = {}
        self._init_user_and_portfolio_state()

    @property
    def monitored_symbols(self) -> List[str]:
        """
        Dynamically fetches all active monitored symbols from the database.
        """
        return LiveMarketService.get_monitored_symbols_from_db()

    def _init_user_and_portfolio_state(self):
        # Default user profile
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

        # Initial tracked holdings (live market valuation calculated dynamically)
        self.portfolio_positions[demo_user.id] = [
            PortfolioPosition(
                id="pos_1",
                symbol="TATASIL",
                name="Tata Steel Limited",
                shares=250.0,
                average_buy_price=152.00,
                current_price=152.00,
                invested_amount=38000.0,
                current_value=38000.0,
                unrealized_pnl=0.0,
                unrealized_pnl_pct=0.0,
                buy_date="2026-08-15"
            ),
            PortfolioPosition(
                id="pos_2",
                symbol="RELIANCE",
                name="Reliance Industries Ltd",
                shares=15.0,
                average_buy_price=2890.00,
                current_price=2890.00,
                invested_amount=43350.0,
                current_value=43350.0,
                unrealized_pnl=0.0,
                unrealized_pnl_pct=0.0,
                buy_date="2026-09-01"
            ),
            PortfolioPosition(
                id="pos_3",
                symbol="GOLDBEES",
                name="Nippon India ETF Gold BeES",
                shares=300.0,
                average_buy_price=64.10,
                current_price=64.10,
                invested_amount=19230.0,
                current_value=19230.0,
                unrealized_pnl=0.0,
                unrealized_pnl_pct=0.0,
                buy_date="2026-07-20"
            )
        ]

    def get_all_summaries(self) -> List[StockSummary]:
        """
        Fetches live real-time summaries for all monitored market tickers.
        """
        return LiveMarketService.get_live_summaries(self.monitored_symbols)

    def get_stock_detail(self, symbol: str) -> Optional[StockDetail]:
        """
        Fetches live real-time stock details, candles, and AI forecasts for any symbol.
        """
        try:
            return LiveMarketService.fetch_live_stock_detail(symbol.upper().strip())
        except Exception as e:
            logger.error(f"Error fetching live stock detail for {symbol}: {e}")
            return None

    def search_stocks(self, query: str) -> List[StockSummary]:
        """
        Dynamic search across monitored symbols or on-demand live lookup.
        """
        q = query.lower().strip()
        results: List[StockSummary] = []
        all_summaries = self.get_all_summaries()
        for stock in all_summaries:
            if q in stock.symbol.lower() or q in stock.name.lower() or q in stock.category.lower():
                results.append(stock)
        
        # If no locally monitored stock matched, attempt live fetch on the query ticker directly
        if not results and len(q) >= 2:
            try:
                live_item = self.get_stock_detail(q.upper())
                if live_item:
                    results.append(
                        StockSummary(
                            symbol=live_item.symbol,
                            name=live_item.name,
                            category=live_item.category,
                            exchange=live_item.exchange,
                            current_price=live_item.current_price,
                            change_amount=live_item.change_amount,
                            change_pct=live_item.change_pct,
                            currency=live_item.currency,
                            volume_24h=live_item.volume_24h,
                            market_cap=live_item.market_cap,
                            sparkline=live_item.sparkline,
                            morning_signal=live_item.morning_signal
                        )
                    )
            except Exception:
                pass

        return results

    def get_morning_signals(self) -> List[MorningSignal]:
        """
        Generates 9:00 AM morning signals computed dynamically from live historical candles.
        """
        signals: List[MorningSignal] = []
        all_summaries = self.get_all_summaries()
        for stock in all_summaries:
            if stock.morning_signal:
                signals.append(stock.morning_signal)
        # Sort by confidence descending
        signals.sort(key=lambda s: s.confidence, reverse=True)
        return signals

    def get_portfolio_summary(self, user_id: str) -> PortfolioSummary:
        """
        Computes user portfolio metrics dynamically using live real-time market prices.
        """
        positions = self.portfolio_positions.get(user_id, [])
        updated_positions: List[PortfolioPosition] = []
        total_inv = 0.0
        total_curr = 0.0
        
        for pos in positions:
            try:
                detail = self.get_stock_detail(pos.symbol)
                live_price = detail.current_price if detail else pos.current_price
            except Exception:
                live_price = pos.current_price

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
