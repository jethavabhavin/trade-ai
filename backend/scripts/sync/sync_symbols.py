#!/usr/bin/env python3
"""
TradeAI Market Symbols Synchronizer
Fetches latest real-time stock/ETF/Index metadata directly from live market API (yfinance & NSE India)
and persists into MySQL / SQLite database table `market_symbols`.
Usage: python backend/scripts/sync/sync_symbols.py
"""

import os
import sys
from datetime import datetime

# UTF-8 stdout encoding for Windows terminal
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root and backend to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))
for path in [backend_dir, project_root]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.database import engine, SessionLocal, db_dialect
    from backend.db_models import Base, MarketSymbolDB
    from backend.services.symbol_registry_service import SymbolRegistryService
except ImportError:
    from database import engine, SessionLocal, db_dialect
    from db_models import Base, MarketSymbolDB
    from services.symbol_registry_service import SymbolRegistryService

def sync_latest_market_symbols():
    print("==================================================================")
    print("   TradeAI Live Market Symbols Importer & Database Synchronizer   ")
    print("==================================================================")
    print(f"Connected Database: {db_dialect.upper()}")
    print("Connecting to live market API to discover trending & active symbols...\n")

    Base.metadata.create_all(bind=engine)

    # 100% Dynamically discover from third-party live market APIs and persist to DB
    synced = SymbolRegistryService.sync_symbols_to_db()

    db = SessionLocal()
    try:
        symbols = db.query(MarketSymbolDB).filter(MarketSymbolDB.is_active == True).all()
        print(f"\n[SUCCESS] Successfully imported & synced {len(symbols)} market symbols from live API into {db_dialect.upper()}:\n")
        print(f"{'SYMBOL':<14} {'CATEGORY':<10} {'EXCHANGE':<10} {'CURRENCY':<8} {'ASSET NAME'}")
        print("-" * 80)
        for s in symbols:
            print(f"{s.symbol:<14} {s.category:<10} {s.exchange:<10} {s.currency:<8} {s.name}")
        print("=" * 80)
    finally:
        db.close()

if __name__ == "__main__":
    sync_latest_market_symbols()
