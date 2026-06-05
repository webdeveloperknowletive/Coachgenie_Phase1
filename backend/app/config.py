# from pydantic_settings import BaseSettings
# from typing import List, Optional
# from pydantic import field_validator


# class Settings(BaseSettings):
#     APP_NAME: str = "CoachingERP"
#     DEBUG: bool = True
#     ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

#     DATABASE_URL: str = "postgresql+asyncpg://postgres:Aman%40319@localhost:5432/erp"

#     SECRET_KEY: str
#     JWT_ALGORITHM: str = "HS256"
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
#     REFRESH_TOKEN_EXPIRE_DAYS: int = 7

#     BCRYPT_ROUNDS: int = 12
#     RATE_LIMIT_PER_MINUTE: int = 100

#     # ✅ SMTP settings
#     SMTP_HOST: Optional[str] = None
#     SMTP_PORT: int = 587
#     SMTP_USER: Optional[str] = None
#     SMTP_PASSWORD: Optional[str] = None
#     SMTP_FROM: Optional[str] = None

#     # grokq api key
#     GROQ_API_KEY: Optional[str] = None 
#     @property
#     def origins_list(self) -> List[str]:
#         return [
#             o.strip().replace('"', '').replace("'", "")
#             for o in self.ALLOWED_ORIGINS.split(",")
#             if o.strip()
#         ]

#     @field_validator("SECRET_KEY")
#     @classmethod
#     def secret_key_must_be_strong(cls, v: str) -> str:
#         if len(v) < 32 or v == "change_this_to_64_random_chars":
#             raise ValueError("SECRET_KEY must be at least 32 chars and not the default placeholder")
#         return v

#     class Config:
#         env_file = ".env"
#         extra = "ignore"


# settings = Settings()


from pydantic_settings import BaseSettings
from typing import List, Optional
from pydantic import field_validator
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "CoachingERP"
    DEBUG: bool = Field(default=True, description="Enable debug mode for detailed error messages")
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:Aman%40319@localhost:5432/erp"

    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BCRYPT_ROUNDS: int = 12
    RATE_LIMIT_PER_MINUTE: int = 100

    # SMTP settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None

    # Groq API
    GROQ_API_KEY: Optional[str] = None

    # WhatsApp (Meta Cloud API)
    WHATSAPP_ACCESS_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = None
    WHATSAPP_API_VERSION: str = "v19.0"

    # SMS (Twilio) — add if you're using SMS too
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    @property
    def origins_list(self) -> List[str]:
        return [
            o.strip().replace('"', '').replace("'", "")
            for o in self.ALLOWED_ORIGINS.split(",")
            if o.strip()
        ]

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if len(v) < 32 or v == "change_this_to_64_random_chars":
            raise ValueError("SECRET_KEY must be at least 32 chars and not the default placeholder")
        return v

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
# Module-level aliases for direct imports
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
