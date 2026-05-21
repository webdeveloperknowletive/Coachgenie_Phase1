# from pydantic_settings import BaseSettings
# from typing import List


# class Settings(BaseSettings):
#     APP_NAME: str = "CoachingERP"
#     DEBUG: bool = True
#     ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

#     # DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5433/erp"
#     DATABASE_URL: str = "postgresql+asyncpg://postgres:Aman@319@localhost:5433/erp"

#     SECRET_KEY: str = "change_this_to_64_random_chars"
#     JWT_ALGORITHM: str = "HS256"
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
#     REFRESH_TOKEN_EXPIRE_DAYS: int = 7

#     BCRYPT_ROUNDS: int = 12
#     RATE_LIMIT_PER_MINUTE: int = 100

#     OPENAI_API_KEY: str = ""
#     SMTP_HOST: str = ""
#     SMTP_PORT: int = 587
#     SMTP_USER: str = ""
#     SMTP_PASSWORD: str = ""
#     SMTP_FROM: str = ""

#     WHATSAPP_API_URL: str = ""
#     WHATSAPP_PHONE_NUMBER_ID: str = ""
#     WHATSAPP_ACCESS_TOKEN: str = ""

#     @property
#     def origins_list(self) -> List[str]:
#         return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

#     class Config:
#         env_file = ".env"
#         extra = "ignore"


# settings = Settings()


from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    APP_NAME: str = "CoachingERP"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:Aman%40319@localhost:5432/erp"

    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BCRYPT_ROUNDS: int = 12
    RATE_LIMIT_PER_MINUTE: int = 100

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