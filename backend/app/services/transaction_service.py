from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, func, or_, update

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.user import RoleEnum, User
from app.schemas.transaction import TransactionCreate
from app.services.exchange_service import get_exchange_rate

class SelfDirectedTransaction(ValueError):
    pass


class InsufficientFunds(ValueError):
    pass


def cents(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


async def create_transaction(
    db: AsyncSession, user_id: int, data: TransactionCreate
) -> Transaction | None:
    is_transfer = data.type == TransactionType.envio
    email = data.beneficiary_email if is_transfer else data.requested_from_email
    counterparty_role = RoleEnum.receptor if is_transfer else RoleEnum.emisor
    counterparty = await db.scalar(select(User).where(User.email == email))
    if counterparty is None:
        return None
    if counterparty.id == user_id:
        raise SelfDirectedTransaction()
    if counterparty.role not in (counterparty_role, RoleEnum.ambos):
        return None

    rate = Decimal(str(await get_exchange_rate()))

    if is_transfer:
        amount_usd = cents(Decimal(str(data.amount_usd)))
        amount_gtq = cents(amount_usd * rate)
        # The guarded update serializes debits to the same balance.
        debited_user = await db.scalar(
            update(User)
            .where(User.id == user_id, User.available_usd >= amount_usd)
            .values(available_usd=User.available_usd - amount_usd)
            .returning(User.id)
        )
        if debited_user is None:
            raise InsufficientFunds()
    else:
        amount_gtq = cents(Decimal(str(data.amount_gtq)))
        amount_usd = cents(amount_gtq / rate)

    transaction = Transaction(
        user_id=user_id,
        beneficiary_id=counterparty.id if is_transfer else None,
        requested_from_id=None if is_transfer else counterparty.id,
        type=data.type,
        amount_usd=float(amount_usd),
        amount_gtq=float(amount_gtq),
        exchange_rate=float(rate),
        note=data.note,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    if not is_transfer:
        await db.refresh(transaction, ["user", "requested_from"])
    return transaction

async def get_transactions(
    db: AsyncSession, user_id: int, page: int = 1, page_size: int = 10, view: str | None = None
):
    offset = (page - 1) * page_size
    owned = Transaction.user_id == user_id
    received = Transaction.beneficiary_id == user_id
    requested_from = Transaction.requested_from_id == user_id

    if view == "emisor":
        participant = or_(and_(owned, Transaction.type == TransactionType.envio), requested_from)
    elif view == "receptor":
        participant = or_(received, and_(owned, Transaction.type == TransactionType.solicitud))
    else:
        participant = or_(owned, received, requested_from)
    total_result = await db.execute(
        select(func.count()).select_from(Transaction).where(participant)
    )
    total = total_result.scalar()

    result = await db.execute(
        select(Transaction)
        .where(participant)
        .options(selectinload(Transaction.user), selectinload(Transaction.requested_from))
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
        amount_gtq = cents(Decimal(str(transaction.amount_gtq)))
        await db.execute(
            update(User)
            .where(User.id == beneficiary_id)
            .values(available_gtq=User.available_gtq + amount_gtq)
        )
        transaction.status = TransactionStatus.confirmado
        await db.commit()
        await db.refresh(transaction)
    return transaction
