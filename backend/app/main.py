from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.core.migrations import upgrade_database
from app.api.v1.endpoints import auth, transactions, users
from app.services.demo_service import seed_demo_users

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(upgrade_database)
        if settings.DEMO_MODE:
            async with AsyncSessionLocal.begin() as session:
                await seed_demo_users(session)
        yield
    finally:
        await engine.dispose()


app = FastAPI(title="Senda Payments API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["transactions"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])

@app.get("/healthz", include_in_schema=False)
async def health_check():
    return {"status": "ok"}


if settings.FRONTEND_BUILD_DIR is None:
    @app.get("/")
    async def root():
        return {"message": "Senda Payments API"}
else:
    frontend_index = settings.FRONTEND_BUILD_DIR / "index.html"

    @app.get("/", include_in_schema=False)
    @app.get("/login", include_in_schema=False)
    @app.get("/dashboard/emisor", include_in_schema=False)
    @app.get("/dashboard/receptor", include_in_schema=False)
    async def frontend_page():
        return FileResponse(frontend_index)

    app.mount("/", StaticFiles(directory=settings.FRONTEND_BUILD_DIR), name="frontend")
