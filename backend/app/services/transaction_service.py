from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func, or_

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.user import RoleEnum, User
from app.schemas.transaction import TransactionCreate
from app.services.exchange_service import get_exchange_rate

async def create_transaction(
    db: AsyncSession, user_id: int, data: TransactionCreate
) -> Transaction | None:
    beneficiary_id = None
    if data.type == TransactionType.envio:
        beneficiary_id = await db.scalar(
            select(User.id).where(
                User.email == data.beneficiary_email,
                User.role.in_((RoleEnum.receptor, RoleEnum.ambos)),
                User.id != user_id,
            )
        )
        if beneficiary_id is None:
            return None

    rate = await get_exchange_rate()

    if data.type == TransactionType.envio:
        amount_usd = data.amount_usd
        amount_gtq = round(amount_usd * rate, 2)
    else:
        amount_gtq = data.amount_gtq
        amount_usd = round(amount_gtq / rate, 2)

    transaction = Transaction(
        user_id=user_id,
        beneficiary_id=beneficiary_id,
        type=data.type,
        amount_usd=amount_usd,
        amount_gtq=amount_gtq,
        exchange_rate=rate,
        note=data.note,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction

async def get_transactions(
    db: AsyncSession, user_id: int, page: int = 1, page_size: int = 10, view: str | None = None
):
    offset = (page - 1) * page_size
    owned = Transaction.user_id == user_id
    received = Transaction.beneficiary_id == user_id

    if view == "emisor":
        participant = and_(owned, Transaction.type == TransactionType.envio)
    elif view == "receptor":
        participant = or_(received, and_(owned, Transaction.type == TransactionType.solicitud))
    else:
        participant = or_(owned, received)
    total_result = await db.execute(
        select(func.count()).select_from(Transaction).where(participant)
    )
    total = total_result.scalar()

    result = await db.execute(
        select(Transaction)
        .where(participant)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return {"items": items, "total": total, "page": page, "page_size": page_size}

async def confirm_transaction(
    db: AsyncSession, transaction_id: int, beneficiary_id: int
) -> Transaction | None:
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.beneficiary_id == beneficiary_id,
            Transaction.type == TransactionType.envio,
        ).with_for_update()
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        return None

    if transaction.status == TransactionStatus.pendiente:
        transaction.status = TransactionStatus.confirmado
        await db.commit()
        await db.refresh(transaction)
    return transaction
