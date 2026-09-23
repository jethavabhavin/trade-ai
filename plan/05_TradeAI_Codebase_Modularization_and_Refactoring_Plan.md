# Codebase Architecture & Modularization Implementation Plan

## Goal Description
Refactor and modularize large monolithic files (such as `live_market_service.py` [1,132 lines], `pine_script_engine.py` [434 lines], and `db_models.py` [445 lines]) into a clean, layered architecture adhering to enterprise coding standards and single-responsibility principles, while preserving 100% backward compatibility with all existing imports, routes, and unit tests.

---

## Folder & Architecture Structure

```
backend/
├── agents/                       # Multi-Agent Forecasting System
│   ├── base_agent.py
│   ├── fusion_risk_agent.py
│   ├── market_data_agent.py
│   ├── orchestrator_agent.py
│   ├── quant_forecaster_agent.py
│   ├── reasoning_agent.py
│   └── sentiment_agent.py
│
├── core/                         # Core Infrastructure & Configuration
│   ├── __init__.py
│   ├── database.py               # SQLAlchemy Engine, SessionLocal, NullPool/QueuePool
│   └── auth_utils.py             # JWT, Password Hashing, RBAC, Audit Logging
│
├── models/                       # Data Definitions & Schemas
│   ├── __init__.py
│   ├── db_models.py              # SQLAlchemy DB Entities (UserDB, WishlistDB, PineScriptDB, etc.)
│   └── schemas.py                # Pydantic Schemas (StockSummary, MultiAgent, PineScript, etc.)
│
├── services/                     # Business Logic & External Integrations
│   ├── __init__.py
│   ├── market_data_service.py    # Live Yahoo/NSE Quote & Candle Fetcher with in-memory TTL cache
│   ├── trade_store_service.py    # Persistent DB Trade Data Caching & Rebuild
│   ├── symbol_registry_service.py# Symbol resolution, dynamic NSE metadata sync & ticker aliases
│   ├── technical_indicators.py   # Pure math indicator calculations (RSI, MACD, Bollinger, ATR)
│   ├── forecast_service.py       # Next-week and 1D heuristic projection algorithms
│   ├── timesfm_service.py        # PyTorch TimesFM 3.0 Zero-Shot Foundation Model wrapper
│   └── mock_data_service.py      # Deterministic fallback generators
│
├── pine_scripts/                 # TradingView Pine Script v5/v6 Engine
│   ├── __init__.py
│   ├── engine.py                 # Pine Script Generator Facade
│   ├── simulator.py              # Quantitative Backtesting Simulation Engine
│   └── presets/                  # Dedicated Strategy Template Generators
│       ├── __init__.py
│       ├── timesfm_neural.py     # TimesFM Multi-Horizon Quantile Bands
│       ├── premarket_orb.py      # 9:00 AM IST Opening Range Breakout
│       ├── supertrend.py         # Dual SuperTrend + 200 EMA + RSI
│       ├── multi_agent.py        # 6-Agent Consensus Overlay
│       └── scalper.py            # 5m Intraday VWAP Scalper
│
├── routers/                      # REST API Endpoints
│   ├── admin.py
│   ├── auth.py
│   ├── forecast.py
│   ├── pine_script.py
│   ├── portfolio.py
│   ├── stocks.py
│   └── wishlist.py
│
├── main.py                       # FastAPI Application Factory
└── test_backend.py               # Full Automated Test Suite
```

---

## Implemented Components & Services

### Component 1: Modularized Services (`backend/services/`)

#### [NEW] [backend/services/symbol_registry_service.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/services/symbol_registry_service.py)
- Ticker resolution (`resolve_ticker`), alias mapping (`ALIASES`), NSE dynamic symbol discovery (`fetch_nse_symbols_from_api`), and DB registry synchronization (`sync_symbols_to_db`, `get_monitored_symbols_from_db`).

#### [NEW] [backend/services/trade_store_service.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/services/trade_store_service.py)
- Full database persistence (`save_trade_data_to_db`) and cached retrieval (`get_trade_data_from_db`) with automatic connection cleanup (`try...finally: db.close()`).

#### [NEW] [backend/services/mock_data_service.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/services/mock_data_service.py)
- Synthetic realistic stock details, historical fallback series, and sector summaries.

#### [NEW] [backend/services/market_data_service.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/services/market_data_service.py)
- Core live Yahoo Finance & NSE quotes fetcher, caching layer, and multi-timeframe candle aggregations.

#### [NEW] [backend/services/__init__.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/services/__init__.py)
- Clean module exports.

#### [MODIFY] [backend/live_market_service.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/live_market_service.py)
- Lightweight facade delegating to modular services with 100% backward compatibility for all existing callers.

---

### Component 2: Pine Script Engine Modularization (`backend/pine_scripts/`)

#### [NEW] [backend/pine_scripts/presets/timesfm_neural.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/presets/timesfm_neural.py)
#### [NEW] [backend/pine_scripts/presets/premarket_orb.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/presets/premarket_orb.py)
#### [NEW] [backend/pine_scripts/presets/supertrend.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/presets/supertrend.py)
#### [NEW] [backend/pine_scripts/presets/multi_agent.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/presets/multi_agent.py)
#### [NEW] [backend/pine_scripts/presets/scalper.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/presets/scalper.py)
#### [NEW] [backend/pine_scripts/presets/__init__.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/presets/__init__.py)
#### [NEW] [backend/pine_scripts/simulator.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/simulator.py)
#### [NEW] [backend/pine_scripts/engine.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/engine.py)
#### [NEW] [backend/pine_scripts/__init__.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_scripts/__init__.py)

#### [MODIFY] [backend/pine_script_engine.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/pine_script_engine.py)
- Orchestration facade delegating to modular presets and simulator.

---

## Verification Results

### Automated Unit Tests
```powershell
.venv\Scripts\pytest.exe backend/test_backend.py -v
```
- **11 / 11 tests passed (100%)**

### Frontend Compilation
```powershell
cd frontend
npm run build
```
- **0 errors, build completed successfully**
