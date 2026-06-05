from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import create_user, authenticate_user
from app.core.database import get_db
from app.core.security import create_access_token
from app.core.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
@limiter.limit("5/minute")
async def register(user: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    return await create_user(db, user)

@router.post("/login")
@limiter.limit("5/minute")
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "role": user.role
    })

    return {"access_token": token, "token_type": "bearer"}
