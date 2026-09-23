import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Request
from sqlalchemy.orm import Session

try:
    from backend.models import UserLoginRequest, UserSignupRequest, UserProfile, AuthResponse
    from backend.database import get_db
    from backend.db_models import UserDB
    from backend.auth_utils import (
        hash_password, verify_password, create_access_token, 
        get_current_user, log_audit_event
    )
except ImportError:
    from models import UserLoginRequest, UserSignupRequest, UserProfile, AuthResponse
    from database import get_db
    from db_models import UserDB
    from auth_utils import (
        hash_password, verify_password, create_access_token, 
        get_current_user, log_audit_event
    )

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=AuthResponse)
def login(request: UserLoginRequest, req: Request, db: Session = Depends(get_db)):
    """
    Authenticate user via Email and Password, issuing a secure JWT token.
    """
    email_clean = request.email.strip().lower()
    user = db.query(UserDB).filter(UserDB.email == email_clean).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated or suspended by an Administrator."
        )
    
    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Record Audit Log
    client_ip = req.client.host if req.client else "127.0.0.1"
    log_audit_event(
        db=db,
        action="LOGIN",
        user_id=user.id,
        username=user.username,
        details=f"Successful login from IP {client_ip}",
        ip_address=client_ip
    )

    # Generate JWT Token with sub=user.id and role
    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    
    return AuthResponse(
        token=token,
        user=UserProfile(**user.to_profile_dict())
    )

@router.post("/signup", response_model=AuthResponse)
def signup(request: UserSignupRequest, req: Request, db: Session = Depends(get_db)):
    """
    Register a new user account with hashed password and return JWT credentials.
    """
    username_clean = request.username.strip()
    email_clean = request.email.strip().lower()

    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Check for existing user
    if db.query(UserDB).filter(UserDB.email == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    if db.query(UserDB).filter(UserDB.username == username_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken. Please choose another."
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    user_role = request.role.lower() if request.role in ["user", "admin"] else "user"

    new_user = UserDB(
        id=user_id,
        username=username_clean,
        email=email_clean,
        password_hash=hash_password(request.password),
        full_name=request.full_name.strip(),
        role=user_role,
        is_active=True,
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        risk_tolerance="MODERATE",
        morning_alert_time="08:30 AM",
        enable_push_notifications=True,
        watchlist_json='["TATASIL", "NIFTY50", "RELIANCE"]',
        portfolio_balance=100000.0,
        created_at=datetime.utcnow(),
        last_login_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    client_ip = req.client.host if req.client else "127.0.0.1"
    log_audit_event(
        db=db,
        action="SIGNUP",
        user_id=new_user.id,
        username=new_user.username,
        details=f"New user registered with role {user_role}",
        ip_address=client_ip
    )

    token = create_access_token(data={"sub": new_user.id, "role": new_user.role, "email": new_user.email})

    return AuthResponse(
        token=token,
        user=UserProfile(**new_user.to_profile_dict())
    )

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: UserDB = Depends(get_current_user)):
    """
    Returns profile information of the currently authenticated JWT user.
    """
    return UserProfile(**current_user.to_profile_dict())

@router.get("/me", response_model=UserProfile)
def get_me(current_user: UserDB = Depends(get_current_user)):
    """
    Quick self-introspection endpoint for frontends to verify active session.
    """
    return UserProfile(**current_user.to_profile_dict())

@router.put("/profile", response_model=UserProfile)
def update_profile(
    updated: UserProfile, 
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the authenticated user's profile preferences and settings.
    """
    current_user.full_name = updated.full_name
    if updated.avatar_url:
        current_user.avatar_url = updated.avatar_url
    current_user.risk_tolerance = updated.risk_tolerance
    current_user.morning_alert_time = updated.morning_alert_time
    current_user.enable_push_notifications = updated.enable_push_notifications
    current_user.watchlist = updated.watchlist

    db.commit()
    db.refresh(current_user)

    return UserProfile(**current_user.to_profile_dict())

@router.post("/watchlist/toggle")
def toggle_watchlist(
    symbol: str, 
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adds or removes a stock symbol from the authenticated user's watchlist.
    """
    symbol_upper = symbol.strip().upper()
    current_watchlist = list(current_user.watchlist)

    if symbol_upper in current_watchlist:
        current_watchlist.remove(symbol_upper)
        status_msg = "removed"
    else:
        current_watchlist.append(symbol_upper)
        status_msg = "added"

    current_user.watchlist = current_watchlist
    db.commit()
    db.refresh(current_user)

    return {"status": status_msg, "symbol": symbol_upper, "watchlist": current_watchlist}

@router.post("/refresh", response_model=AuthResponse)
def refresh_token(current_user: UserDB = Depends(get_current_user)):
    """
    Refreshes the active JWT access token for the authenticated user.
    """
    token = create_access_token(data={"sub": current_user.id, "role": current_user.role, "email": current_user.email})
    return AuthResponse(
        token=token,
        user=UserProfile(**current_user.to_profile_dict())
    )

@router.post("/logout")
def logout(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Server-side audit registration of user logout.
    """
    log_audit_event(
        db=db,
        action="LOGOUT",
        user_id=current_user.id,
        username=current_user.username,
        details="User logged out"
    )
    return {"status": "success", "message": "Successfully logged out"}

