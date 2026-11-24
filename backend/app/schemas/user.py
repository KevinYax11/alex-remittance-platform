from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

from app.models.user import RoleEnum


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    accept_terms: Literal[True]

    @field_validator("password")
    @classmethod
    def require_bcrypt_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("La contraseña supera el límite de 72 bytes.")
        return password


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: RoleEnum


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    user_id: int
    full_name: str


class RegistrationResponse(TokenResponse):
    id: int
    email: EmailStr

class WalletResponse(BaseModel):
    available_usd: Decimal
    available_gtq: Decimal
    pending_gtq: Decimal
    demo_credit_usd: Decimal
