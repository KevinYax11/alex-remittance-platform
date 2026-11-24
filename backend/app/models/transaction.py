from sqlalchemy import Column, Integer, Float, String, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base

class TransactionType(str, enum.Enum):
    envio = "envio"
    solicitud = "solicitud"

class TransactionStatus(str, enum.Enum):
    pendiente = "pendiente"
    confirmado = "confirmado"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    beneficiary_id = Column(Integer, ForeignKey("users.id"), index=True)
    requested_from_id = Column(Integer, ForeignKey("users.id"), index=True)
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pendiente)
    amount_usd = Column(Float, nullable=False)
    amount_gtq = Column(Float, nullable=False)
    exchange_rate = Column(Float, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions", foreign_keys=[user_id])

    requested_from = relationship("User", foreign_keys=[requested_from_id])

    @property
    def requested_from_email(self) -> str | None:
        return self.requested_from.email if self.requested_from_id is not None else None

    @property
    def requester_email(self) -> str | None:
        return self.user.email if self.type == TransactionType.solicitud else None
