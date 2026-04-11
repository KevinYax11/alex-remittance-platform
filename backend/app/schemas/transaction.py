from pydantic import BaseModel, field_validator
from datetime import datetime
from app.models.transaction import TransactionType, TransactionStatus

class TransactionCreate(BaseModel):
    type: TransactionType
    amount_usd: float | None = None
    amount_gtq: float | None = None
    note: str | None = None

    @field_validator("amount_usd", "amount_gtq")
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Amount must be positive")
        return v

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    type: TransactionType
    status: TransactionStatus
    amount_usd: float
    amount_gtq: float
    exchange_rate: float
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    page_size: int