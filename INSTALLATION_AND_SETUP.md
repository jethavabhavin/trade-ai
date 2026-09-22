# TradeAI Installation & Setup Guide

Welcome to the **TradeAI** setup guide. TradeAI is an autonomous, multi-agent AI stock trading & forecasting intelligence platform powered by **Google TimesFM 3.0** numeric foundation forecasting and **Google Gemini** qualitative reasoning.

---

## 📋 Default Credentials

During initial database creation (`schema.sql` or `init_db.py`), default accounts are automatically provisioned:

| Role | Username | Password | Email | Access Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | `admin@tradeai.io` | Full Admin Panel, User Management, Role Assignment, Status Toggling, Forecasts |
| **Trader (Standard)** | `trader_pro` | `password123` | `trader@tradeai.io` | Multi-Agent Neural Forecasts, Interactive Graphs, 9:00 AM Daily Signals |

> [!IMPORTANT]
> All unauthenticated visitors are automatically routed to the full-screen Cyberpunk Login screen. To access forecasts, users must authenticate with one of the credentials above or register via the **Create Free Account** sign-up link.

---

## ⚙️ Configuration Reference (`.env`)

Create a `.env` file in the `backend/` directory or at the project root using `backend/.env.example` as a template:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MYSQL_HOST` | `localhost` (or `db` in Docker) | Hostname for MySQL 8.0 server |
| `MYSQL_PORT` | `3306` | MySQL server port |
| `MYSQL_USER` | `root` (or `tradeai` in Docker) | MySQL database username |
| `MYSQL_PASSWORD` | `""` (or `password123` in Docker) | MySQL database password |
| `MYSQL_DATABASE` | `tradeai_db` | MySQL database name |
| `DATABASE_URL` | *(Optional)* | Full connection URI (e.g. `mysql+pymysql://user:pass@host:3306/db`) |
| `JWT_SECRET_KEY` | `tradeai_super_secret_jwt_key_timesfm_2026_secure` | Cryptographic secret for signing JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 Hours) | JWT token session lifetime in minutes |
| `GEMINI_API_KEY` | *(Optional)* | Google Gemini API key for live NLP sentiment & reasoning. Fallback heuristic engine activates if omitted. |

---

## 🚀 Option 1: Docker Deployment (Recommended)

Deploy the entire full-stack application (MySQL 8.0, FastAPI Multi-Agent Backend, Angular 22 Frontend, and Nginx reverse proxy) in a single command.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS / Linux)

### Steps
1. **Clone & Enter Workspace**:
   ```bash
   cd TradeAI
   ```

2. **(Optional) Configure Gemini API Key**:
   Set `GEMINI_API_KEY` in your environment or inside `docker-compose.yml`.

3. **Launch Docker Stack**:
   ```bash
   docker-compose up --build
   ```

4. **Access the Application**:
   - **Frontend UI**: [http://localhost:4200](http://localhost:4200)
   - **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Backend Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🛠️ Option 2: Local Manual Setup

### Prerequisites
- **Python**: 3.12+ (64-bit)
- **Node.js**: 20.x or 22.x LTS (`npm` 9+)
- **MySQL**: 8.0+ running on `localhost:3306`

---

### Step 1: Database Initialization
1. Start your local MySQL service (e.g., via MySQL Workbench, XAMPP, or command line).
2. Execute `backend/schema.sql` against your MySQL instance:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
   *This creates `tradeai_db` database, `users` & `audit_logs` tables, and seeds the default `admin` and `trader_pro` accounts.*

---

### Step 2: Backend Setup (FastAPI + TimesFM)
1. Navigate to the project root and create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```
2. Activate the virtual environment:
   - **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
   - **Windows (CMD)**: `.venv\Scripts\activate.bat`
   - **Linux / macOS**: `source .venv/bin/activate`
3. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *(Update `MYSQL_PASSWORD` if your MySQL root account has a password)*
5. Start the backend server:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *(Or run `start_backend.bat` on Windows)*

---

### Step 3: Frontend Setup (Angular 22)
1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   ```
   *(Or run `start_frontend.bat` on Windows)*
4. Open your browser at [http://localhost:4200](http://localhost:4200).

---

## 🧪 Running Automated Tests

Run the full test suite (backend pytest test cases + frontend Angular production build verification):

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
  .venv/bin/pytest backend/test_backend.py -v
  ```
