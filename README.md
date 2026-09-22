# TradeAI — Autonomous Multi-Agent AI Stock Intelligence & Forecasting Platform

<div align="center">
  <h3>⚡ Google TimesFM 3.0 Numeric Foundation Forecasting × Google Gemini Qualitative Reasoning ⚡</h3>
  <p>An enterprise cyber-financial algorithmic trading suite featuring an autonomous 6-agent collaborative state graph, 9:00 AM Pre-Market daily digest, interactive quantile trajectory charts, and JWT/MySQL role-based access control.</p>
</div>

---

## 🌟 Key Platform Features

### 1. 🤖 6-Agent Autonomous Collaborative State Graph
TradeAI executes a synchronized multi-agent state graph pipeline for zero-shot time-series forecasting combined with qualitative financial intelligence:
- **MarketDataAgent**: Ingests live & historical OHLCV pricing with automated ticker conversion (e.g., `TATASIL` ➔ `TATASTEEL.NS`, `NIFTY50` ➔ `^NSEI`, `AAPL`, `NVDA`), and computes 14-day RSI, 20/50-day SMAs, and volatility indicators.
- **SentimentAgent (Gemini)**: Leverages Google Gemini NLP to analyze market news sentiment polarities, regulatory tailwinds, and macro catalysts.
- **QuantForecasterAgent (Google TimesFM 3.0)**: Generates zero-shot transformer numeric forecasts with 10th (Support), 50th (Point Estimate), and 90th (Resistance) quantile prediction channels.
- **ReasoningAgent (Gemini)**: Cross-examines quantitative trajectories against sector momentum and earnings backdrop to prevent false breakouts.
- **FusionRiskAgent (Gemini)**: Calibrates trade conviction, calculates Stop-Loss & Take-Profit targets, and enforces non-commercial CC BY-NC-4.0 licensing guardrails.
- **OutputAgent & OrchestratorAgent**: Compiles step-by-step latency telemetry, executive summaries, and action consensus (`STRONG BUY`, `BUY`, `HOLD`, `SELL`, `STRONG SELL`).

### 2. 📡 Real-Time Active Agent Execution Indicator
- Live neon blue radar beacon visually tracks active agents in real time during multi-agent synthesis.
- Step-by-step state badges (`WORKING`, `DONE`, `WAITING`) with millisecond execution latency telemetry for every agent.

### 3. ☀️ 9:00 AM Pre-Market Intelligence Digest
- Pre-market sentiment assessment generated every morning before Indian / Global market opening bells.
- Top Bullish Spotlight (e.g. Tata Steel ETF / Index Fund) with target price and projected ROI percentage.

### 4. 📈 Interactive Cyberpunk Quantile Chart Visualizer
- Multi-timeframe canvas rendering historical candlestick & close price lines merged seamlessly with autoregressive future paths.
- Quantile ribbon highlighting probabilistic upper & lower volatility boundaries (Q10 vs Q90).

### 5. 🛡️ Enterprise Security & RBAC Admin Panel
- **Full-Screen Login Barrier**: Protected routes ensure only authenticated users access proprietary forecasts.
- **JWT Authentication**: Cryptographic token signing with auto-refresh and secure local persistence.
- **MySQL 8.0 Persistence**: Relational storage for users, encrypted bcrypt password hashes, and user roles (`admin` / `user`).
- **Administrative Control Suite**: Accessible only to users with the `admin` role for managing users, promoting roles, deactivating accounts, and auditing user activity.

---

## 🏗️ Architecture & State Graph Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                 Client (Angular 22 SPA)                     │
│  [Active Agent Beacon]  [Interactive Charts]  [Admin Panel] │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API + JWT Bearer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FastAPI Backend Gateway                     │
│           (Security, Auth & Role Enforcement)               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐
   │    MySQL 8.0 Database     │ │    Orchestrator Agent     │
   │  (Users, RBAC, Audit)     │ │   (6-Step State Graph)    │
   └───────────────────────────┘ └─────────────┬─────────────┘
                                               │
       ┌───────────────────────────────────────┼───────────────────────────────────────┐
       ▼                                       ▼                                       ▼
┌──────────────┐                       ┌──────────────┐                        ┌──────────────┐
│MarketDataAgnt│                       │SentimentAgnt │                        │QuantForecast │
│  (yfinance)  │                       │   (Gemini)   │                        │(TimesFM 3.0) │
└──────┬───────┘                       └──────┬───────┘                        └──────┬───────┘
       │                                       │                                       │
       └───────────────────────────────────────┼───────────────────────────────────────┘
                                               ▼
                               ┌───────────────────────────────┐
                               │   Reasoning Agent (Gemini)    │
                               └───────────────┬───────────────┘
                                               ▼
                               ┌───────────────────────────────┐
                               │  Fusion & Risk Agent (Gemini) │
                               └───────────────┬───────────────┘
                                               ▼
                               ┌───────────────────────────────┐
                               │         Output Agent          │
                               │  (Consensus & Trace Packet)   │
                               └───────────────────────────────┘
```

---

## 🔑 Default Provisioned Credentials

The database initializes with two pre-configured accounts:

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Full administrator privileges (User management, role assignment, system health, and forecasts) |
| `trader_pro` | `password123` | `user` | Standard trader account with full forecast and trading dashboard access |

---

## ⚡ Quickstart Deployment

### Option A: One-Click Docker Compose (Recommended)
```bash
# 1. Start all containers (MySQL, Backend, Frontend & Nginx)
docker-compose up --build

# 2. Access the Application:
# Frontend: http://localhost:4200
# Backend API Docs: http://localhost:8000/docs
```

### Option B: Local Development
```bash
# 1. Initialize Database
mysql -u root -p < backend/schema.sql

# 2. Start Backend
python -m venv .venv
.venv\Scripts\activate          # Or source .venv/bin/activate on Linux/Mac
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Start Frontend (in a separate terminal)
cd frontend
npm install
npm start
```

*For detailed instructions, refer to the [INSTALLATION_AND_SETUP.md](INSTALLATION_AND_SETUP.md) guide.*

---

## 🧪 Automated Test Suite

Run the full end-to-end verification suite across backend and frontend:

```bash
# Windows
run_tests.bat

# Linux / macOS
chmod +x run_tests.sh
./run_tests.sh
```

---

## 🌐 API Endpoints Reference

### Authentication & RBAC (`/api/auth`)
- `POST /api/auth/login`: Authenticate and receive signed JWT bearer token.
- `POST /api/auth/register`: Create new standard trader account.
- `GET /api/auth/me`: Fetch authenticated user profile and permissions.
- `GET /api/auth/admin/users`: Admin-only listing of all system users.
- `PUT /api/auth/admin/users/{user_id}/status`: Admin-only account activation/deactivation.
- `PUT /api/auth/admin/users/{user_id}/role`: Admin-only promotion to `admin` / `user`.

### Multi-Agent Forecast Intelligence (`/api/forecast`)
- `POST /api/forecast/multi-agent-analyze`: Execute 6-agent collaborative forecast pipeline.
  - **Payload**: `{ "symbol": "TATASIL", "horizon": 7, "risk_tolerance": "MODERATE" }`
- `GET /api/forecast/{symbol}/multi-agent-analysis`: Query multi-agent intelligence with query params.
- `GET /api/forecast/{symbol}/timesfm-predict`: Direct TimesFM foundation model numerical forecast.

### Market Data & Signals (`/api/stocks`)
- `GET /api/stocks`: List all monitored assets with prices & indicators.
- `GET /api/stocks/{symbol}`: Full historical and forecasted asset detail.
- `GET /api/stocks/signals/morning`: 9:00 AM pre-market actionable calls.
- `GET /api/stocks/digest/today`: Pre-market intelligence daily digest.

---

## 📜 Licensing & Usage Notice
TimesFM is released by Google under non-commercial research licensing (CC BY-NC 4.0). TradeAI outputs are generated for informational and algorithmic research purposes and do not constitute registered financial advice.
