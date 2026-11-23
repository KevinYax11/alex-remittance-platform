from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import RoleEnum, User


async def seed_demo_users(session: AsyncSession) -> None:
    # Serialize the empty-table check with concurrent inserts and startup attempts.
    await session.execute(text("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE"))
    if await session.scalar(select(User.id).limit(1)) is not None:
        return

    session.add_all([
        User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password("SendaPass123!"),
            role=role,
        )
        for full_name, email, role in (
            ("Remitente Demo", "sender@sendapayments.com", RoleEnum.emisor),
            ("Beneficiario Demo", "receiver@sendapayments.com", RoleEnum.receptor),
        )
    ])
