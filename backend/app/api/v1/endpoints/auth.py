from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.user import LoginRequest, RegistrationResponse, TokenResponse, UserCreate
from app.services.auth_service import login_user, register_user, session_for_user

router = APIRouter()


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, user_data)
    if not user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese correo ya tiene una cuenta.")
    return {**session_for_user(user), "id": user.id, "email": user.email}


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await login_user(db, credentials.email, credentials.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return result
