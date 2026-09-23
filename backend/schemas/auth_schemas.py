from pydantic import BaseModel, Field
from typing import List, Optional

class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str = "user" # "user", "admin"
    is_active: bool = True
    avatar_url: Optional[str] = None
    risk_tolerance: str = "MODERATE" # "CONSERVATIVE", "MODERATE", "AGGRESSIVE"
    morning_alert_time: str = "08:30 AM"
    enable_push_notifications: bool = True
    watchlist: List[str] = Field(default_factory=list)

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserSignupRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: Optional[str] = "user"

class AuthResponse(BaseModel):
    token: str
    user: UserProfile
