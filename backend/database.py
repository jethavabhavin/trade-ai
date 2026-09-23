import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Determine database URL (MySQL default with automatic fallback to SQLite)
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "tradeai_db")

custom_db_url = os.getenv("DATABASE_URL")

data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(data_dir, exist_ok=True)
sqlite_fallback_path = os.path.join(data_dir, "tradeai.db")
sqlite_url = f"sqlite:///{sqlite_fallback_path}"

engine = None
db_dialect = "sqlite"

if custom_db_url:
    target_urls = [custom_db_url, sqlite_url]
else:
    # Try MySQL first, then fallback to SQLite
    mysql_url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
    target_urls = [mysql_url, sqlite_url]

from sqlalchemy.pool import NullPool, QueuePool

for url in target_urls:
    try:
        if "sqlite" in url:
            connect_args = {"check_same_thread": False, "timeout": 30}
            test_engine = create_engine(
                url,
                connect_args=connect_args,
                poolclass=NullPool
            )
        else:
            connect_args = {"connect_timeout": 5}
            test_engine = create_engine(
                url,
                connect_args=connect_args,
                pool_size=30,
                max_overflow=50,
                pool_timeout=60,
                pool_recycle=300,
                pool_pre_ping=True
            )
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        db_dialect = "mysql" if "mysql" in url else "sqlite"
        print(f"[Database] Successfully connected to {db_dialect.upper()} at: {url.split('@')[-1] if '@' in url else url}")
        break
    except Exception as e:
        print(f"[Database] Could not connect to {url.split('@')[-1] if '@' in url else url}: {e}")

if engine is None:
    print(f"[Database] Falling back to local SQLite at {sqlite_url}")
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False, "timeout": 30},
        poolclass=NullPool
    )
    db_dialect = "sqlite"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI Dependency for database sessions with auto-close."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
