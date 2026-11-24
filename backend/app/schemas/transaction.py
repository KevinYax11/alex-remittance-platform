from pydantic import BaseModel, EmailStr, Field, model_validator
from datetime import datetime
from app.models.transaction import TransactionType, TransactionStatus

class TransactionCreate(BaseModel):
    type: TransactionType
    amount_usd: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    amount_gtq: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    beneficiary_email: EmailStr | None = None
    requested_from_email: EmailStr | None = None
    note: str | None = None

    @model_validator(mode="after")
    def require_fields_for_transaction_type(self):
        if self.type == TransactionType.envio:
            if self.amount_usd is None or self.beneficiary_email is None:
                raise ValueError("Un envío requiere un monto en USD y el correo del beneficiario.")
        elif self.amount_gtq is None or self.requested_from_email is None:
            raise ValueError("Una solicitud requiere un monto en GTQ y el correo de la persona a quien solicitas el dinero.")
        return self

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    beneficiary_id: int | None
    requested_from_id: int | None
    requested_from_email: str | None
    requester_email: str | None
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
