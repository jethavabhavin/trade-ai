#!/usr/bin/env python3
"""
TradeAI Market Symbols Synchronizer Facade
Delegates to backend/scripts/sync/sync_symbols.py
"""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.scripts.sync.sync_symbols import sync_latest_market_symbols

if __name__ == "__main__":
    sync_latest_market_symbols()
