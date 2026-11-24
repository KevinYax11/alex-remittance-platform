from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.transaction import TransactionType
from app.models.user import RoleEnum
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionListResponse
from app.services.transaction_service import InsufficientFunds, SelfDirectedTransaction, create_transaction, get_transactions, confirm_transaction
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return payload

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    required_role = (
        RoleEnum.emisor if data.type == TransactionType.envio else RoleEnum.receptor
    )
    if current_user["role"] not in (required_role, RoleEnum.ambos):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operación no permitida.")

    try:
        transaction = await create_transaction(db, int(current_user["sub"]), data)
    except SelfDirectedTransaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ingresa el correo de otra cuenta. No puedes usar tu propio correo.",
        ) from None
    except InsufficientFunds:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tu saldo en USD no alcanza para enviar esta remesa.",
        ) from None
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No se encontró un beneficiario con ese correo."
                if data.type == TransactionType.envio
                else "No encontramos una cuenta que pueda enviar remesas con ese correo."
            ),
        )
    return transaction

@router.get("/", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    view: Literal["emisor", "receptor"] | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await get_transactions(db, int(current_user["sub"]), page, page_size, view)

@router.patch("/{transaction_id}/confirm", response_model=TransactionResponse)
async def confirm(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in (RoleEnum.receptor, RoleEnum.ambos):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el beneficiario puede confirmar la recepción.",
        )
    transaction = await confirm_transaction(db, transaction_id, int(current_user["sub"]))
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Remesa no encontrada."
        )
    return transaction
