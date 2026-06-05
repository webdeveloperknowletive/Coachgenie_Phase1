from fastapi import APIRouter, Depends
from app.dependencies import get_tenant, get_current_user, DB
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, UserOut
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=201)
async def register(
    body: RegisterRequest,
    db: DB,
    tenant=Depends(get_tenant),
):
    user = await auth_service.register_user(db, str(tenant.id), body.model_dump())
    return {
        "success": True,
        "data": {"id": str(user.id), "email": user.email, "role": user.role}
    }


@router.post("/login")
async def login(
    body: LoginRequest,
    db: DB,
    tenant=Depends(get_tenant),
):
    result = await auth_service.login_user(db, str(tenant.id), body.email, body.password)
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer",
        "user": UserOut(
            id=str(result["user"].id),
            email=result["user"].email,
            first_name=result["user"].first_name,
            last_name=result["user"].last_name,
            role=result["user"].role,
            tenant_id=str(result["user"].tenant_id),
        ),
    }


@router.post("/refresh")
async def refresh(body: RefreshRequest, db: DB):
    tokens = await auth_service.refresh_tokens(db, body.refresh_token)
    return tokens


@router.post("/logout")
async def logout(body: RefreshRequest, db: DB):
    await auth_service.logout_user(db, body.refresh_token)
    return {"success": True, "message": "Logged out successfully."}


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role,
        }
    }
