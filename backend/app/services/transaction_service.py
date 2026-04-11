from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.schemas.transaction import TransactionCreate
from app.services.exchange_service import get_exchange_rate

async def create_transaction(db: AsyncSession, user_id: int, data: TransactionCreate) -> Transaction:
    rate = await get_exchange_rate()

    if data.type == TransactionType.envio:
        amount_usd = data.amount_usd
        amount_gtq = round(amount_usd * rate, 2)
    else:
        amount_gtq = data.amount_gtq
        amount_usd = round(amount_gtq / rate, 2)

    transaction = Transaction(
        user_id=user_id,
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

async def get_transactions(db: AsyncSession, user_id: int, page: int = 1, page_size: int = 10):
    offset = (page - 1) * page_size

    total_result = await db.execute(
        select(func.count()).where(Transaction.user_id == user_id)
    )
    total = total_result.scalar()

    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return {"items": items, "total": total, "page": page, "page_size": page_size}

async def confirm_transaction(db: AsyncSession, transaction_id: int, user_id: int):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        return None

    transaction.status = TransactionStatus.confirmado
    await db.commit()
    await db.refresh(transaction)
    return transaction