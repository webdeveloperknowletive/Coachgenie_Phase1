import re
from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str | None = None
    role: str = "student"

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Must contain uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Must contain lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Must contain a digit.")
        if not re.search(r"[@$!%*?&]", v):
            raise ValueError("Must contain special character (@$!%*?&).")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        allowed = {"owner", "counselor", "tutor", "parent", "student"}
        if v not in allowed:
            raise ValueError(f"Role must be one of {allowed}")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    tenant_id: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
