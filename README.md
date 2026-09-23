# TradeAI — Autonomous Multi-Agent AI Stock Intelligence & Forecasting Platform

<div align="center">
  <h3>⚡ Google TimesFM 3.0 Numeric Foundation Forecasting × Google Gemini Qualitative Reasoning ⚡</h3>
  <p>An enterprise cyber-financial algorithmic trading suite featuring an autonomous 6-agent collaborative state graph, 9:00 AM Pre-Market daily digest, interactive quantile trajectory charts, DB-backed Wishlist, TradingView Pine Script Studio, and JWT/MySQL role-based access control.</p>
</div>

---

## 🌟 Key Platform Features

### 1. 🤖 6-Agent Autonomous Collaborative State Graph
TradeAI executes a synchronized multi-agent state graph pipeline for zero-shot time-series forecasting combined with qualitative financial intelligence:
- **MarketDataAgent**: Ingests live & historical OHLCV pricing with automated ticker resolution (e.g., `TATASIL` ➔ `TATASTEEL.NS`, `NIFTY50` ➔ `^NSEI`, `AAPL`, `NVDA`, `IONQ`), computing 14-day RSI, MACD, and volatility indicators.
- **SentimentAgent (Gemini)**: Leverages Google Gemini NLP to analyze market news sentiment polarities, regulatory tailwinds, and macro catalysts.
- **QuantForecasterAgent (Google TimesFM 3.0)**: Generates zero-shot transformer numeric forecasts with 10th (Support), 50th (Point Estimate), and 90th (Resistance) quantile prediction channels.
- **ReasoningAgent (Gemini)**: Cross-examines quantitative trajectories against sector momentum and earnings backdrop to prevent false breakouts.
- **FusionRiskAgent (Gemini)**: Calibrates trade conviction, calculates Stop-Loss & Take-Profit targets, and enforces non-commercial CC BY-NC-4.0 licensing guardrails.
- **OutputAgent & OrchestratorAgent**: Compiles step-by-step latency telemetry, executive summaries, and action consensus (`STRONG BUY`, `BUY`, `HOLD`, `SELL`, `STRONG SELL`).

### 2. 📡 Real-Time Active Agent Execution Telemetry
- Live neon blue radar beacon visually tracks active agents in real time during multi-agent synthesis.
- Step-by-step state badges (`WORKING`, `DONE`, `WAITING`) with millisecond execution latency telemetry for every agent.

### 3. ☀️ 9:00 AM Pre-Market Intelligence Digest
- Pre-market sentiment assessment generated every morning before Indian / Global market opening bells.
- Top Bullish Spotlight (e.g., Tata Steel ETF / Index Fund) with target price and projected ROI percentage.

### 4. 📈 Interactive Cyberpunk Quantile Chart Visualizer
- Multi-timeframe canvas rendering historical candlestick & close price lines merged seamlessly with autoregressive future paths.
- Quantile ribbon highlighting probabilistic upper & lower volatility boundaries (Q10 vs Q90).

### 5. 📑 Persistent Database Wishlist & Watchlist
- Manage custom stock & ETF watchlists backed by database persistence.
- Set target buy prices, notes, and alert flags with live real-time price delta and distance-to-target tracking.

### 6. 🌲 TradingView Pine Script v5 Studio
- Generate production-ready TradingView Pine Script v5 code using AI prompts and battle-tested strategy presets (RSI + MACD Reversals, TimesFM Volatility Bands, Supertrend).
- Save, edit, and organize generated Pine Scripts in your personal library with one-click clipboard copy.

### 7. 🔍 Debounced Fast Market Search (`Ctrl+K`)
- Reactive RxJS 300ms debounced search with animated loading indicators and instant keyboard navigation.

### 8. 🛡️ Enterprise Security, MySQL/SQLite Dual Storage & RBAC Admin Panel
- **JWT Bearer Authentication**: Cryptographic token signing with auto-refresh and secure local persistence.
- **Dual Database Engine**: Auto-connects to MySQL 8.0 with seamless zero-config fallback to SQLite.
- **Administrative Control Suite**: Admin-only panel for managing users, promoting roles, deactivating accounts, and auditing user activity.
- **Interactive Swagger Documentation**: Comprehensive OpenAPI documentation and Swagger UI at `/docs` with persistent authorization.

---

## 🏗️ Architecture & Project Structure

```
TradeAI/
├── backend/                         # FastAPI Application Backend
│   ├── agents/                      # Multi-Agent State Graph & AI Engines
│   │   ├── base_agent.py            # Base agent protocol
│   │   ├── market_data_agent.py     # Live market OHLCV fetcher & technicals
│   │   ├── sentiment_agent.py       # Gemini NLP news sentiment analyzer
│   │   ├── quant_forecaster_agent.py# Google TimesFM 3.0 foundation forecaster
│   │   ├── reasoning_agent.py       # Gemini qualitative financial logic
│   │   ├── fusion_risk_agent.py     # Risk calibrator, SL/TP calculator
│   │   ├── output_agent.py          # Consensus synthesizer
│   │   ├── orchestrator_agent.py    # 6-step state graph pipeline coordinator
│   │   ├── forecast_engine.py       # Technical & signal generator
│   │   └── timesfm_service.py       # TimesFM PyTorch inference engine
│   ├── models/                      # SQLAlchemy Database ORM Models
│   │   ├── user_model.py            # UserDB & AuditLogDB
│   │   ├── symbol_model.py          # MarketSymbolDB
│   │   ├── trade_model.py           # TradeDataDB
│   │   ├── prediction_model.py      # PredictionDB
│   │   ├── wishlist_model.py        # WishlistDB
│   │   └── pine_script_model.py     # PineScriptDB
│   ├── schemas/                     # Pydantic Request & Response Schemas
│   │   ├── auth_schemas.py          # Auth & user schemas
│   │   ├── market_schemas.py        # Stocks, candles & summaries
│   │   ├── forecast_schemas.py      # Signals & predictions
│   │   ├── wishlist_schemas.py      # Watchlist CRUD schemas
│   │   ├── pine_script_schemas.py   # Pine Script generator schemas
│   │   ├── admin_schemas.py         # Admin management schemas
│   │   └── multi_agent_schemas.py   # Multi-agent trace schemas
│   ├── routers/                     # FastAPI Route Controllers
│   │   ├── auth.py                  # /api/auth
│   │   ├── admin.py                 # /api/admin
│   │   ├── stocks.py                # /api/stocks (Public & Auth)
│   │   ├── forecast.py              # /api/forecast
│   │   ├── portfolio.py             # /api/portfolio
│   │   ├── wishlist.py              # /api/wishlist
│   │   └── pine_script.py           # /api/pinescript
│   ├── scripts/                     # Standalone CLI & Synchronization Scripts
│   │   └── sync/                    # Market symbol metadata synchronization
│   │       └── sync_symbols.py      # Live symbol registry synchronizer
│   ├── tests/                       # Backend Pytest Test Suites
│   │   ├── test_backend.py          # 12 comprehensive integration tests
│   │   └── test_timesfm.py          # TimesFM numeric inference tests
│   ├── database.py                  # Database session & dual-engine connector
│   ├── auth_utils.py                # Password hashing & JWT verification
│   └── main.py                      # FastAPI gateway & Swagger UI
├── frontend/                        # Angular 22 Cyberpunk SPA
│   └── src/app/
│       ├── components/              # Standalone Angular components
│       │   ├── header/              # Navigation & Quick Search trigger
│       │   ├── search-modal/        # Debounced stock & ETF search modal
│       │   ├── market-overview/     # Live stock ticker cards & sparklines
│       │   ├── stock-detail/        # Quantile trajectory chart visualizer
│       │   ├── pre-market-digest/   # 9:00 AM AI morning signals
│       │   ├── multi-agent-panel/   # Real-time 6-agent execution beacon
│       │   ├── watchlist/           # Persistent DB wishlist & target prices
│       │   ├── pine-script-studio/  # TradingView Pine Script v5 generator
│       │   ├── admin/               # RBAC user management & audit logs
│       │   └── auth-modal/          # Cyberpunk login & registration modal
│       └── services/                # TradeAPI, Auth, Admin & PineScript services
├── plan/                            # Project Architecture & Modularization Plans
├── run_tests.bat                    # Automated Windows test runner
├── run_tests.sh                     # Automated Linux/Mac test runner
├── start_backend.bat                # Windows backend launch script
└── start_frontend.bat               # Windows frontend launch script
```

---

## 🔑 Default Provisioned Credentials

The database initializes with pre-configured accounts:

| Role | Username | Password | Email | Access Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `AdminPassword@123` *(or `admin123`)* | `admin@tradeai.app` | Full Admin Panel, User Management, Role Assignment, Status Toggling, Forecasts |
| **Trader (User)** | `trader` | `TraderPassword@123` *(or `password123`)* | `trader@tradeai.app` | Multi-Agent Neural Forecasts, Interactive Graphs, Wishlist, Pine Script Studio |

---

## ⚡ Quickstart Deployment

### Option A: One-Click Docker Compose (Recommended)
```bash
# 1. Start all containers (MySQL, Backend, Frontend & Nginx)
docker-compose up --build

# 2. Access the Application:
# Frontend UI: http://localhost:4200
# Backend Swagger Docs: http://localhost:8000/docs
```

### Option B: Local Development
```bash
# 1. Start Backend (in terminal 1)
python -m venv .venv
.venv\Scripts\activate          # Or source .venv/bin/activate on Linux/Mac
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# 2. Start Frontend (in terminal 2)
cd frontend
npm install
npm start
```

*For step-by-step setup details, refer to [INSTALLATION_AND_SETUP.md](INSTALLATION_AND_SETUP.md).*

---

## 🧪 Automated Test Suite

Run the full end-to-end verification suite across backend and frontend:

```bash
# Windows
run_tests.bat

# Linux / macOS
chmod +x run_tests.sh
./run_tests.sh

# Pytest Directly
.venv\Scripts\pytest.exe backend/tests/test_backend.py -v
```

---

## 🌐 API Documentation & Interactive Swagger

FastAPI includes built-in interactive API documentation:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 📜 Licensing & Usage Notice
TimesFM is released by Google under non-commercial research licensing (CC BY-NC 4.0). TradeAI outputs are generated for algorithmic research and prototyping purposes and do not constitute certified financial advice.
