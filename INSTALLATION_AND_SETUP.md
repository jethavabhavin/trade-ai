# TradeAI Installation & Setup Guide

Welcome to the **TradeAI** setup guide. TradeAI is an enterprise autonomous multi-agent AI stock trading & forecasting intelligence platform powered by **Google TimesFM 3.0** numeric foundation forecasting and **Google Gemini** qualitative reasoning.

---

## 📋 Default Credentials

During initial database initialization, default accounts are automatically provisioned:

| Role | Username | Password | Email | Access Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `AdminPassword@123` *(or `admin123`)* | `admin@tradeai.app` | Full Admin Panel, User Management, Role Assignment, Status Toggling, Forecasts |
| **Trader (User)** | `trader` | `TraderPassword@123` *(or `password123`)* | `trader@tradeai.app` | Multi-Agent Neural Forecasts, Interactive Graphs, Wishlist, Pine Script Studio |

---

## ⚙️ Configuration Reference (`.env`)

Configure environment variables at the root or inside the `backend/` directory:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MYSQL_HOST` | `localhost` (or `db` in Docker) | Hostname for MySQL 8.0 server |
| `MYSQL_PORT` | `3306` | MySQL server port |
| `MYSQL_USER` | `root` (or `tradeai` in Docker) | MySQL database username |
| `MYSQL_PASSWORD` | `""` (or `password123` in Docker) | MySQL database password |
| `MYSQL_DATABASE` | `tradeai_db` | MySQL database name |
| `DATABASE_URL` | *(Optional)* | Full connection URI (falls back to SQLite `backend/data/tradeai.db` if MySQL is unreachable) |
| `JWT_SECRET_KEY` | `tradeai_super_secret_jwt_key_timesfm_2026_secure` | Secret key for cryptographic JWT signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 Hours) | JWT token session validity in minutes |
| `GEMINI_API_KEY` | *(Optional)* | Google Gemini API key for live NLP news sentiment & reasoning. Robust heuristic fallback activates if omitted. |

---

## 🚀 Option 1: Docker Compose Deployment (Recommended)

Deploy the full stack (MySQL 8.0, FastAPI Backend, Angular 22 Frontend, and Nginx reverse proxy) in a single command.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Steps
1. **Clone & Enter Workspace**:
   ```bash
   cd TradeAI
   ```

2. **Launch Docker Stack**:
   ```bash
   docker-compose up --build
   ```

3. **Access the Application**:
   - **Frontend UI**: [http://localhost:4200](http://localhost:4200)
   - **Swagger API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
   - **Backend Root Status**: [http://localhost:8000/](http://localhost:8000/)

---

## 🛠️ Option 2: Local Manual Setup

### Prerequisites
- **Python**: 3.12+ (64-bit)
- **Node.js**: 20.x or 22.x LTS (`npm` 10+)
- **MySQL** *(Optional)*: 8.0+ running on `localhost:3306` (SQLite fallback activates automatically if MySQL is not running)

---

### Step 1: Backend Setup (FastAPI + TimesFM)

1. Navigate to the project root and create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```

2. Activate the virtual environment:
   - **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
   - **Windows (CMD)**: `.venv\Scripts\activate.bat`
   - **Linux / macOS**: `source .venv/bin/activate`

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. *(Optional)* Synchronize market asset metadata into the database:
   ```bash
   python backend/scripts/sync/sync_symbols.py
   ```

5. Start the FastAPI development server:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *(Or run `start_backend.bat` on Windows)*

---

### Step 2: Frontend Setup (Angular 22)

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Angular dev server:
   ```bash
   npm start
   ```
   *(Or run `start_frontend.bat` from project root on Windows)*

4. Open your browser at [http://localhost:4200](http://localhost:4200).

---

## 🧪 Running Automated Tests

TradeAI includes a complete 12-suite integration test runner covering auth, RBAC, live market data, multi-agent forecasts, database wishlist CRUD, and TradingView Pine Script generation:

- **Windows**:
  ```bat
  run_tests.bat
  ```
- **Linux / macOS**:
  ```bash
  chmod +x run_tests.sh
  ./run_tests.sh
  ```
- **Direct Pytest**:
  ```bash
  pytest backend/tests/test_backend.py -v
  ```

---

## 📁 Key Architectural Directories

- `backend/agents/`: Multi-agent pipeline (MarketData, Sentiment, QuantForecaster, Reasoning, FusionRisk, Output, Orchestrator, TimesFMService).
- `backend/models/`: SQLAlchemy ORM database models (`UserDB`, `MarketSymbolDB`, `TradeDataDB`, `PredictionDB`, `WishlistDB`, `PineScriptDB`).
- `backend/schemas/`: Pydantic schemas for request validation and response typing.
- `backend/routers/`: Modular route endpoints (`auth`, `stocks`, `forecast`, `portfolio`, `wishlist`, `pine_script`, `admin`).
- `backend/scripts/sync/`: Market data synchronization and symbol seed utilities.
- `backend/tests/`: Pytest automated test suites.
- `plan/`: Architectural planning and refactoring specifications.
