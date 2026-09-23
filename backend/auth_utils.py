import os
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

try:
    from backend.database import get_db, Base, engine, SessionLocal
    from backend.db_models import UserDB, AuditLogDB
except ImportError:
    from database import get_db, Base, engine, SessionLocal
    from db_models import UserDB, AuditLogDB

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tradeai_ultra_secure_jwt_secret_key_2026_timesfm")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 Hours

security = HTTPBearer(auto_error=True)

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Encodes a JWT access token with payload and expiration."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserDB:
    """
    FastAPI dependency that extracts Bearer token, validates JWT, 
    and returns the active UserDB record.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = auth.credentials
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated or suspended. Please contact admin."
        )
    
    return user

def get_current_admin_user(
    current_user: UserDB = Depends(get_current_user)
) -> UserDB:
    """
    FastAPI dependency that verifies the authenticated user has 'admin' role.
    """
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privilege required. Access denied."
        )
    return current_user

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    username: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Utility to record an audit log event into the database."""
    try:
        log = AuditLogDB(
            user_id=user_id,
            username=username,
            action=action,
            details=details,
            ip_address=ip_address,
            created_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Audit Log Error]: {e}")

def init_db_and_seed():
    """Initializes tables and seeds default Admin and Trader accounts."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if admin exists
        admin_user = db.query(UserDB).filter(UserDB.email == "admin@tradeai.app").first()
        if not admin_user:
            admin_user = UserDB(
                id="usr_admin_01",
                username="admin_super",
                email="admin@tradeai.app",
                password_hash=hash_password("AdminPassword@123"),
                full_name="Chief Market Admin",
                role="admin",
                is_active=True,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                risk_tolerance="AGGRESSIVE",
                morning_alert_time="08:30 AM",
                enable_push_notifications=True,
                watchlist_json='["TATASIL", "NIFTY50", "RELIANCE", "AAPL", "GOLDBEES"]',
                portfolio_balance=250000.0,
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            print("[Database Seed] Created default Admin: admin@tradeai.app / AdminPassword@123")

        # Check if demo trader exists
        trader_user = db.query(UserDB).filter(UserDB.email == "trader@tradeai.app").first()
        if not trader_user:
            trader_user = UserDB(
                id="usr_demo_01",
                username="trader_pro",
                email="trader@tradeai.app",
                password_hash=hash_password("TraderPassword@123"),
                full_name="Alex Vance",
                role="user",
                is_active=True,
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                risk_tolerance="MODERATE",
                morning_alert_time="08:30 AM",
                enable_push_notifications=True,
                watchlist_json='["TATASIL", "NIFTY50", "RELIANCE"]',
                portfolio_balance=100000.0,
                created_at=datetime.utcnow()
            )
            db.add(trader_user)
            print("[Database Seed] Created default Trader: trader@tradeai.app / TraderPassword@123")

        # Check and seed/sync Market Symbols from API
        try:
            from backend.db_models import MarketSymbolDB
            from backend.live_market_service import LiveMarketService
        except ImportError:
            from db_models import MarketSymbolDB
            from live_market_service import LiveMarketService
            
        sym_count = db.query(MarketSymbolDB).count()
        if sym_count == 0:
            print("[Database Seed] Syncing market symbols from API into database...")
            LiveMarketService.sync_symbols_to_db()

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Database Seed Error]: {e}")
    finally:
        db.close()
