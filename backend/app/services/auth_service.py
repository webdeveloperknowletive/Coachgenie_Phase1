from sqlalchemy.future import select
from app.models.user import User
from app.core.security import hash_password, verify_password

async def create_user(db, user_data):
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        tenant_id=user_data.tenant_id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(db, email, password):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
