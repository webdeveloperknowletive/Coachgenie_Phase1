from fastapi import APIRouter, Depends
from app.dependencies import get_tenant, get_current_user, DB
from app.schemas.auth_extended import (
    ForgotPasswordRequest, VerifyOTPRequest,
    ResetPasswordRequest, ChangePasswordRequest,
    UpdateProfileRequest, ProfileOut
)
from app.services import auth_extended as auth_ext_service

router = APIRouter(prefix="/auth", tags=["Auth Extended"])


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    db: DB,
    tenant=Depends(get_tenant),
):
    result = await auth_ext_service.forgot_password(
        db, str(tenant.id), body.email
    )
    await db.commit()
    return {"success": True, **result}


@router.post("/verify-otp")
async def verify_otp(
    body: VerifyOTPRequest,
    db: DB,
    tenant=Depends(get_tenant),
):
    await auth_ext_service.verify_otp(
        db, str(tenant.id), body.email, body.otp
    )
    await db.commit()
    return {"success": True, "message": "OTP verified successfully."}


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    db: DB,
    tenant=Depends(get_tenant),
):
    result = await auth_ext_service.reset_password(
        db, str(tenant.id), body.email, body.otp, body.new_password
    )
    await db.commit()
    return {"success": True, **result}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    db: DB,
    current_user=Depends(get_current_user),
):
    result = await auth_ext_service.change_password(
        db,
        str(current_user.id),
        body.current_password,
        body.new_password
    )
    return {"success": True, **result}


@router.get("/profile", response_model=ProfileOut)
async def get_profile(
    current_user=Depends(get_current_user),
):
    return ProfileOut(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        avatar_url=current_user.avatar_url,
        role=current_user.role,
        tenant_id=str(current_user.tenant_id),
    )


@router.patch("/profile")
async def update_profile(
    body: UpdateProfileRequest,
    db: DB,
    current_user=Depends(get_current_user),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    user = await auth_ext_service.update_profile(db, str(current_user.id), data)
    return {
        "success": True,
        "data": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "role": user.role,
        }
    }
