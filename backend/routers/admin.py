import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

try:
    from backend.models import (
        AdminUserItem, AdminUserCreateRequest, AdminRoleUpdateRequest,
        AdminStatusUpdateRequest, AdminStatsResponse, AuditLogItem
    )
    from backend.database import get_db, db_dialect
    from backend.db_models import UserDB, AuditLogDB
    from backend.auth_utils import (
        get_current_admin_user, hash_password, log_audit_event
    )
    from backend.data_store import db as stock_data_store
except ImportError:
    from models import (
        AdminUserItem, AdminUserCreateRequest, AdminRoleUpdateRequest,
        AdminStatusUpdateRequest, AdminStatsResponse, AuditLogItem
    )
    from database import get_db, db_dialect
    from db_models import UserDB, AuditLogDB
    from auth_utils import (
        get_current_admin_user, hash_password, log_audit_event
    )
    from data_store import db as stock_data_store

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    current_admin: UserDB = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Returns platform telemetry KPIs, active user counts, and system status.
    """
    total_users = db.query(UserDB).count()
    active_users = db.query(UserDB).filter(UserDB.is_active == True).count()
    admin_users = db.query(UserDB).filter(UserDB.role == "admin").count()

    # Calculate total simulated trades across portfolio store
    total_positions = sum(len(pos_list) for pos_list in stock_data_store.portfolio_positions.values())
    trade_audit_count = db.query(AuditLogDB).filter(AuditLogDB.action == "TRADE").count()
    total_trades = max(total_positions, trade_audit_count)

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        total_trades=total_trades,
        total_positions=total_positions,
        system_status="OPERATIONAL",
        database_dialect=db_dialect.upper(),
        timesfm_model_status="ONLINE (Ready for 9 AM Pre-market Inference)"
    )

@router.get("/users", response_model=List[AdminUserItem])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status_filter: Optional[str] = None, # "all", "active", "inactive"
    current_admin: UserDB = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all users registered in the system with optional search and role filters.
    """
    query = db.query(UserDB)

    if role and role.lower() != "all":
        query = query.filter(UserDB.role == role.lower())

    if status_filter:
        if status_filter.lower() == "active":
            query = query.filter(UserDB.is_active == True)
        elif status_filter.lower() == "inactive":
            query = query.filter(UserDB.is_active == False)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                UserDB.username.ilike(s),
                UserDB.email.ilike(s),
                UserDB.full_name.ilike(s)
            )
        )

    users = query.order_by(desc(UserDB.created_at)).all()

    result = []
    for u in users:
        result.append(
            AdminUserItem(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                avatar_url=u.avatar_url,
                risk_tolerance=u.risk_tolerance,
                watchlist_count=len(u.watchlist),
                portfolio_balance=u.portfolio_balance,
                created_at=u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else None,
                last_login_at=u.last_login_at.strftime("%Y-%m-%d %H:%M") if u.last_login_at else None
            )
        )
    return result

@router.post("/users", response_model=AdminUserItem)
def create_user_by_admin(
    payload: AdminUserCreateRequest,
    req: Request,
    current_admin: UserDB = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to provision a new user or administrator account.
    """
    username_clean = payload.username.strip()
    email_clean = payload.email.strip().lower()

    if db.query(UserDB).filter(UserDB.email == email_clean).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    if db.query(UserDB).filter(UserDB.username == username_clean).first():
        raise HTTPException(status_code=400, detail="Username already in use")

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    new_user = UserDB(
        id=user_id,
        username=username_clean,
        email=email_clean,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role.lower(),
        is_active=payload.is_active,
        avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        risk_tolerance=payload.risk_tolerance,
        watchlist_json='["TATASIL", "NIFTY50"]',
        portfolio_balance=100000.0,
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action="USER_CREATED_BY_ADMIN",
        user_id=current_admin.id,
        username=current_admin.username,
        details=f"Admin created user {new_user.username} ({new_user.email}) with role {new_user.role}",
        ip_address=req.client.host if req.client else "127.0.0.1"
    )

    return AdminUserItem(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active,
        avatar_url=new_user.avatar_url,
        risk_tolerance=new_user.risk_tolerance,
        watchlist_count=len(new_user.watchlist),
        portfolio_balance=new_user.portfolio_balance,
        created_at=new_user.created_at.strftime("%Y-%m-%d %H:%M") if new_user.created_at else None,
        last_login_at=None
    )

@router.put("/users/{user_id}/role", response_model=AdminUserItem)
def update_user_role(
    user_id: str,
    payload: AdminRoleUpdateRequest,
    req: Request,
    current_admin: UserDB = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Elevate user to 'admin' or demote to 'user'.
    """
    target_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = payload.role.lower()
    if new_role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be 'admin' or 'user'.")

    # Prevent demoting self if only admin
    if target_user.id == current_admin.id and new_role != "admin":
        admin_count = db.query(UserDB).filter(UserDB.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last remaining Administrator.")

    old_role = target_user.role
    target_user.role = new_role
    db.commit()
    db.refresh(target_user)

    log_audit_event(
        db=db,
        action="ROLE_CHANGED",
        user_id=current_admin.id,
        username=current_admin.username,
        details=f"Changed role of {target_user.username} from {old_role} to {new_role}",
        ip_address=req.client.host if req.client else "127.0.0.1"
    )

    return AdminUserItem(
        id=target_user.id,
        username=target_user.username,
        email=target_user.email,
        full_name=target_user.full_name,
        role=target_user.role,
        is_active=target_user.is_active,
        avatar_url=target_user.avatar_url,
        risk_tolerance=target_user.risk_tolerance,
        watchlist_count=len(target_user.watchlist),
        portfolio_balance=target_user.portfolio_balance,
        created_at=target_user.created_at.strftime("%Y-%m-%d %H:%M") if target_user.created_at else None,
        last_login_at=target_user.last_login_at.strftime("%Y-%m-%d %H:%M") if target_user.last_login_at else None
    )

@router.put("/users/{user_id}/status", response_model=AdminUserItem)
def toggle_user_status(
    user_id: str,
    payload: AdminStatusUpdateRequest,
    req: Request,
    current_admin: UserDB = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Toggle user active status (Suspend / Unban / Reactivate).
    """
    target_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_admin.id and not payload.is_active:
        raise HTTPException(status_code=400, detail="You cannot suspend your own admin account.")

    target_user.is_active = payload.is_active
    db.commit()
    db.refresh(target_user)

    action_label = "ACCOUNT_ACTIVATED" if payload.is_active else "ACCOUNT_SUSPENDED"
    log_audit_event(
        db=db,
        action=action_label,
        user_id=current_admin.id,
        username=current_admin.username,
        details=f"Admin toggled active status of {target_user.username} to {payload.is_active}",
        ip_address=req.client.host if req.client else "127.0.0.1"
    )

    return AdminUserItem(
        id=target_user.id,
        username=target_user.username,
        email=target_user.email,
        full_name=target_user.full_name,
        role=target_user.role,
        is_active=target_user.is_active,
        avatar_url=target_user.avatar_url,
        risk_tolerance=target_user.risk_tolerance,
        watchlist_count=len(target_user.watchlist),
        portfolio_balance=target_user.portfolio_balance,
        created_at=target_user.created_at.strftime("%Y-%m-%d %H:%M") if target_user.created_at else None,
        last_login_at=target_user.last_login_at.strftime("%Y-%m-%d %H:%M") if target_user.last_login_at else None
    )

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    req: Request,
    current_admin: UserDB = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Permanently removes a user account from the system.
    """
    target_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    deleted_username = target_user.username
    db.delete(target_user)
    db.commit()

    log_audit_event(
        db=db,
        action="USER_DELETED",
        user_id=current_admin.id,
        username=current_admin.username,
        details=f"Admin deleted user {deleted_username} (ID: {user_id})",
        ip_address=req.client.host if req.client else "127.0.0.1"
    )

    return {"status": "success", "message": f"User {deleted_username} deleted successfully"}

@router.get("/audit-logs", response_model=List[AuditLogItem])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_admin: UserDB = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Returns platform audit history (logins, signups, role changes, trades).
    """
    logs = db.query(AuditLogDB).order_by(desc(AuditLogDB.created_at)).limit(limit).all()
    return [AuditLogItem(**log.to_dict()) for log in logs]
