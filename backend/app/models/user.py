from sqlalchemy import Column, Integer, String, Enum, DateTime, Numeric
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base

class RoleEnum(str, enum.Enum):
    emisor = "emisor"
    receptor = "receptor"
    ambos = "ambos"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    terms_accepted_at = Column(DateTime(timezone=True))
    terms_version = Column(Integer)
    available_usd = Column(Numeric(20, 2), nullable=False, server_default="1000.00")
    available_gtq = Column(Numeric(20, 2), nullable=False, server_default="0.00")
    demo_credit_usd = Column(Numeric(20, 2), nullable=False, server_default="0.00")

    transactions = relationship(
        "Transaction", back_populates="user", foreign_keys="Transaction.user_id"
    )
