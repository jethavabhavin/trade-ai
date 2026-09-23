import os
import sys
import warnings
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

warnings.filterwarnings("ignore", message=".*unauthenticated requests to the HF Hub.*")
warnings.filterwarnings("ignore", category=UserWarning, module="huggingface_hub.*")
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.routers import auth, stocks, forecast, portfolio, admin, wishlist, pine_script
    from backend.auth_utils import init_db_and_seed
    from backend.database import db_dialect
except ImportError:
    from routers import auth, stocks, forecast, portfolio, admin, wishlist, pine_script
    from auth_utils import init_db_and_seed
    from database import db_dialect

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed default users
    print("[Startup] Initializing TradeAI Database and Seed Profiles...")
    init_db_and_seed()
    yield
    print("[Shutdown] TradeAI Application shutting down.")

app = FastAPI(
    title="TradeAI API",
    description="Intelligent Pre-Market Forecast & 9:00 AM Trading Recommendation Platform with JWT Auth & MySQL RBAC",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "tryItOutEnabled": True
    },
    lifespan=lifespan
)

# Enable CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(stocks.router)
app.include_router(forecast.router)
app.include_router(portfolio.router)
app.include_router(wishlist.router)
app.include_router(pine_script.router)

@app.get("/")
def root():
    return {
        "app": "TradeAI Backend",
        "status": "Online",
        "version": "2.0.0",
        "database": db_dialect.upper(),
        "auth": "JWT Bearer Active",
        "pre_market_engine": "Active (Next run 08:45 AM)",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
