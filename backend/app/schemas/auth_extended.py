from pydantic import BaseModel, EmailStr
from typing import Optional


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "owner@demo.com",
                "otp": "123456",
                "new_password": "NewPass@1234"
            }
        }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileOut(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    tenant_id: str

    class Config:
        from_attributes = True
