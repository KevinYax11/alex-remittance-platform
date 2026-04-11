from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionListResponse
from app.services.transaction_service import create_transaction, get_transactions, confirm_transaction
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
    transaction = await create_transaction(db, int(current_user["sub"]), data)
    return transaction

@router.get("/", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await get_transactions(db, int(current_user["sub"]), page, page_size)

@router.patch("/{transaction_id}/confirm", response_model=TransactionResponse)
async def confirm(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    transaction = await confirm_transaction(db, transaction_id, int(current_user["sub"]))
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction