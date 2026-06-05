import uuid
from sqlalchemy import String, Boolean, ForeignKey, text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
        Index("idx_users_tenant", "tenant_id"),
        Index("idx_users_role", "tenant_id", "role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_login_at = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"), onupdate=text("NOW()"))

    tenant = relationship("Tenant", back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("idx_rt_user_tenant", "user_id", "tenant_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    expires_at = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at = mapped_column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    user = relationship("User", back_populates="refresh_tokens")
