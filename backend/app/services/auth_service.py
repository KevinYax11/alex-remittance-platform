from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import RoleEnum, User
from app.schemas.user import UserCreate


async def register_user(db: AsyncSession, user_data: UserCreate) -> User | None:
    statement = (
        insert(User).values(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            role=RoleEnum.ambos,
            terms_accepted_at=datetime.now(timezone.utc),
            terms_version=1,
        )
        .on_conflict_do_nothing(index_elements=[User.email])
        .returning(User)
    )
    user = await db.scalar(statement)
    await db.commit()
    return user


def session_for_user(user: User):
    return {
        "access_token": create_access_token({"sub": str(user.id), "role": user.role.value}),
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
    }


async def login_user(db: AsyncSession, email: str, password: str):
    user = await db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(password, user.hashed_password):
        return None
    return session_for_user(user)
