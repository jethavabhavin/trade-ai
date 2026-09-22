# TradeAI Phase 3: Autonomous Multi-Agent AI Stock Intelligence Pipeline Plan

## Overview
Implement an autonomous 6-agent collaborative state graph combining **Google TimesFM 3.0** numeric foundation forecasting with **Google Gemini** qualitative reasoning, sentiment analysis, risk calibration, and licensing compliance.

---

## 6-Agent State Graph Architecture

```
[User / Client Request]
       │
       ▼
[OrchestratorAgent] ──── Coordinates 6-agent sequential & parallel pipeline
       │
       ├─► 1. MarketDataAgent       (Live OHLCV ingestion via yfinance, RSI, SMAs, volatility)
       │
       ├─► 2. SentimentAgent        (Gemini NLP financial news extraction & polarity scoring)
       │
       ├─► 3. QuantForecasterAgent  (Google TimesFM 3.0 foundation model & Q10-Q90 quantiles)
       │
       ├─► 4. ReasoningAgent        (Gemini qualitative cross-check against news & sector dynamics)
       │
       ├─► 5. FusionRiskAgent       (Signal reconciliation, Stop Loss / Target, CC BY-NC-4.0 guardrails)
       │
       └─► 6. OutputAgent           (Executive summary, risk factors, step trace timeline packet)
```

---

## Agent Specifications & Implementation

### 1. Agents Package (`backend/agents/`)
- **BaseAgent (`base_agent.py`)**: Abstract base class providing standardized `AgentResult` output, status management, and microsecond telemetry tracking.
- **MarketDataAgent (`market_data_agent.py`)**:
  - Automatically translates user tickers to Yahoo Finance exchange formats (`TATASIL` ➔ `TATASTEEL.NS`, `NIFTY50` ➔ `^NSEI`, `AAPL`, `NVDA`, `TSLA`).
  - Fetches 90-day daily price history and computes technical indicators: RSI(14), SMA(20), SMA(50), 30-day volatility.
- **SentimentAgent (`sentiment_agent.py`)**:
  - Leverages Google Gemini (`google-genai`) to parse recent headlines, earnings announcements, and macroeconomic indicators into a normalized sentiment index (-1.0 to +1.0) with catalytic drivers.
  - Built-in heuristic NLP fallback for offline execution.
- **QuantForecasterAgent (`quant_forecaster_agent.py`)**:
  - Interfaces with Google TimesFM 3.0 PyTorch foundation model (`google/timesfm-3.0-pytorch`).
  - Generates autoregressive future price predictions across horizons (3D, 7D, 14D, 30D).
  - Computes 10th (Support Channel), 50th (Point Forecast), and 90th (Resistance Channel) quantile prediction intervals.
- **ReasoningAgent (`reasoning_agent.py`)**:
  - Gemini-powered qualitative cross-examination of quantitative forecast paths against macroeconomic conditions and industry sentiment.
  - Generates alignment status (`ALIGNED_BULLISH`, `ALIGNED_BEARISH`, `DIVERGENT`, `NEUTRAL`).
- **FusionRiskAgent (`fusion_risk_agent.py`)**:
  - Reconciles quantitative signals with qualitative sentiment into final action recommendation (`STRONG BUY`, `BUY`, `HOLD`, `SELL`, `STRONG SELL`).
  - Computes dynamic Stop-Loss (Q10 boundary) and Take-Profit (Q90 boundary) price channels.
  - Enforces Google TimesFM CC BY-NC-4.0 non-commercial research licensing guardrails.
- **OutputAgent (`output_agent.py`)**:
  - Formats complete executive intelligence dossier, narrative rationale, and step-by-step latency trace packet.
- **OrchestratorAgent (`orchestrator_agent.py`)**:
  - Assembles and coordinates the 6-agent workflow and calculates overall pipeline latency.

### 2. Multi-Agent Backend Endpoints (`backend/routers/forecast.py`)
- `POST /api/forecast/multi-agent-analyze`: Accepts `{ symbol, horizon, risk_tolerance }`, executes 6-agent graph, returns complete response.
- `GET /api/forecast/{symbol}/multi-agent-analysis`: Query parameter endpoint for instant multi-agent analysis.

### 3. Frontend Multi-Agent Panel Component (`frontend/src/app/components/multi-agent-panel/`)
- Interactive horizon picker (3D, 7D, 14D, 30D).
- 6-step agent timeline displaying execution latency and summary for every agent.
- Quantile trajectory visualizer comparing Stop-Loss (Q10), Current Price, and Target (Q90).
- Gemini qualitative reasoning critique card and catalytic driver badges.
- Embedded in both **Dashboard** and **Stock Detail** views.
