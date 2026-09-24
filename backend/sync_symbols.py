#!/usr/bin/env python3
"""
TradeAI Market Symbols Synchronizer Facade
Delegates to backend/scripts/sync/sync_symbols.py
"""
import os
import sys

# UTF-8 stdout encoding for Windows terminal
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
for p in [project_root, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.scripts.sync.sync_symbols import sync_latest_market_symbols
except ImportError:
    from scripts.sync.sync_symbols import sync_latest_market_symbols

if __name__ == "__main__":
    sync_latest_market_symbols()
