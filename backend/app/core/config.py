from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/remittance_db"
    SECRET_KEY: str = "supersecretkey123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DEMO_MODE: bool = False
    FRONTEND_BUILD_DIR: Path | None = None

    @field_validator("DATABASE_URL")
    @classmethod
    def use_async_postgres_driver(cls, url: str) -> str:
        scheme, separator, credentials = url.partition("://")
        if scheme in {"postgres", "postgresql"}:
            return f"postgresql+asyncpg{separator}{credentials}"
        return url

settings = Settings()
