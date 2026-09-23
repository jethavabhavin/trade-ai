import logging
from typing import Dict, List, Optional, Any

try:
    from backend.models import StockSummary, StockDetail
    from backend.services.symbol_registry_service import SymbolRegistryService
    from backend.services.trade_store_service import TradeStoreService
    from backend.services.mock_data_service import MockDataService
    from backend.services.market_data_service import MarketDataService
except ImportError:
    from models import StockSummary, StockDetail
    from services.symbol_registry_service import SymbolRegistryService
    from services.trade_store_service import TradeStoreService
    from services.mock_data_service import MockDataService
    from services.market_data_service import MarketDataService

logger = logging.getLogger("LiveMarketService")

class LiveMarketService:
    """
    Facade maintaining 100% backward compatibility for LiveMarketService.
    Delegates domain requests to specialized modular services:
      - SymbolRegistryService: Ticker resolution and symbol synchronization
      - TradeStoreService: Database trade data persistence and cache recovery
      - MockDataService: Fallback synthetic simulation
      - MarketDataService: Real-time price aggregation and technical resampling
    """
    ALIASES = SymbolRegistryService.ALIASES
    CACHE_TTL_SECONDS = MarketDataService.CACHE_TTL_SECONDS

    @classmethod
    def resolve_ticker(cls, symbol: str) -> str:
        return SymbolRegistryService.resolve_ticker(symbol)

    @classmethod
    def fetch_symbol_metadata_from_api(
        cls,
        symbol: str,
        ticker: Optional[str] = None,
        exchange: Optional[str] = None,
        currency: Optional[str] = None,
        name: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        return SymbolRegistryService.fetch_symbol_metadata_from_api(
            symbol=symbol,
            ticker=ticker,
            exchange=exchange,
            currency=currency,
            name=name,
            category=category
        )

    @classmethod
    def fetch_nse_symbols_from_api(cls) -> List[Dict[str, Any]]:
        return SymbolRegistryService.fetch_nse_symbols_from_api()

    @classmethod
    def sync_symbols_to_db(cls, symbols: Optional[List[str]] = None) -> List[str]:
        return SymbolRegistryService.sync_symbols_to_db(symbols)

    @classmethod
    def get_monitored_symbols_from_db(cls) -> List[str]:
        return SymbolRegistryService.get_monitored_symbols_from_db()

    @classmethod
    def save_trade_data_to_db(cls, detail: StockDetail, source: str = "NSE") -> bool:
        return TradeStoreService.save_trade_data_to_db(detail, source=source)

    @classmethod
    def get_trade_data_from_db(cls, symbol: str, max_age_seconds: Optional[float] = None) -> Optional[StockDetail]:
        return TradeStoreService.get_trade_data_from_db(symbol, max_age_seconds=max_age_seconds)

    @classmethod
    def fetch_nse_quote_live(cls, symbol: str) -> Optional[Dict[str, Any]]:
        return MarketDataService.fetch_nse_quote_live(symbol)

    @classmethod
    def fetch_live_stock_detail(
        cls,
        symbol: str,
        fallback_detail: Optional[StockDetail] = None,
        force_refresh: bool = False
    ) -> StockDetail:
        return MarketDataService.fetch_live_stock_detail(
            symbol=symbol,
            fallback_detail=fallback_detail,
            force_refresh=force_refresh
        )

    @classmethod
    def get_live_summaries(cls, symbols: Optional[List[str]] = None) -> List[StockSummary]:
        return MarketDataService.get_live_summaries(symbols=symbols)

    @classmethod
    def generate_fallback_stock_detail(cls, symbol: str) -> StockDetail:
        return MockDataService.generate_fallback_stock_detail(symbol)
