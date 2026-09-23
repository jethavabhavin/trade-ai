from pydantic import BaseModel
from typing import Optional

class AdminUserItem(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    risk_tolerance: str
    watchlist_count: int
    portfolio_balance: float
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None

class AdminUserCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "user" # "user" or "admin"
    is_active: bool = True
    risk_tolerance: str = "MODERATE"

class AdminRoleUpdateRequest(BaseModel):
    role: str # "user" or "admin"

class AdminStatusUpdateRequest(BaseModel):
    is_active: bool

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    total_trades: int
    total_positions: int
    system_status: str
    database_dialect: str
    timesfm_model_status: str

class AuditLogItem(BaseModel):
    id: int
    user_id: Optional[str]
    username: Optional[str]
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    created_at: str
