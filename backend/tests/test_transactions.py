import asyncio
import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.schema import CreateSchema, DropSchema

from app import main
from app.core.database import get_db
from app.schemas.transaction import TransactionCreate
from app.services import transaction_service


TRANSACTIONS = "/api/v1/transactions/"
DEMO_PASSWORD = "SendaPass123!"
SENDER_EMAIL = "sender@sendapayments.com"
BENEFICIARY_EMAIL = "receiver@sendapayments.com"
OTHER_EMAIL = "other@sendapayments.com"


@pytest.mark.parametrize(
    "payload",
    [
        {"type": "envio", "amount_usd": 100},
        {"type": "envio", "beneficiary_email": BENEFICIARY_EMAIL},
        {"type": "envio", "amount_usd": 0, "beneficiary_email": BENEFICIARY_EMAIL},
        {"type": "envio", "amount_usd": 100, "beneficiary_email": "invalid"},
        {"type": "solicitud", "amount_gtq": -10},
        {"type": "solicitud", "amount_gtq": float("inf")},
        {"type": "solicitud"},
    ],
)
def test_rejects_invalid_transaction_payload(payload):
    with pytest.raises(ValidationError):
        TransactionCreate.model_validate(payload)


@pytest.fixture
def client(monkeypatch):
    database_url = os.getenv("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("Set TEST_DATABASE_URL to run the PostgreSQL integration test.")

    schema = f"senda_test_{uuid4().hex}"

    async def execute_schema_ddl(statement):
        admin_engine = create_async_engine(database_url)
        try:
            async with admin_engine.begin() as connection:
                await connection.execute(statement)
        finally:
            await admin_engine.dispose()

    asyncio.run(execute_schema_ddl(CreateSchema(schema)))
    engine = create_async_engine(
        database_url, connect_args={"server_settings": {"search_path": schema}}
    )
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def get_test_db():
        async with factory() as session:
            yield session

    async def fixed_exchange_rate():
        return 7.75

    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "AsyncSessionLocal", factory)
    monkeypatch.setattr(main.settings, "DEMO_MODE", True)
    monkeypatch.setattr(transaction_service, "get_exchange_rate", fixed_exchange_rate)
    monkeypatch.setitem(main.app.dependency_overrides, get_db, get_test_db)

    try:
        with TestClient(main.app) as test_client:
            yield test_client
    finally:
        asyncio.run(execute_schema_ddl(DropSchema(schema, cascade=True, if_exists=True)))


def login(client, email):
    response = client.post(
        "/api/v1/auth/login", json={"email": email, "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def list_transactions(client, headers, **params):
    response = client.get(TRANSACTIONS, headers=headers, params=params)
    assert response.status_code == 200, response.text
    return response.json()


def test_only_assigned_beneficiary_can_confirm_a_remittance(client):
    sender = login(client, SENDER_EMAIL)
    beneficiary = login(client, BENEFICIARY_EMAIL)
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": OTHER_EMAIL,
            "password": DEMO_PASSWORD,
            "full_name": "Other beneficiary",
            "role": "receptor",
        },
    )
    assert response.status_code == 201, response.text
    other = login(client, OTHER_EMAIL)

    transfer = {"type": "envio", "amount_usd": 100, "beneficiary_email": BENEFICIARY_EMAIL}
    assert client.post(TRANSACTIONS, json=transfer, headers=beneficiary).status_code == 403
    invalid_beneficiary = {**transfer, "beneficiary_email": SENDER_EMAIL}
    assert client.post(TRANSACTIONS, json=invalid_beneficiary, headers=sender).status_code == 404

    response = client.post(TRANSACTIONS, json=transfer, headers=sender)
    assert response.status_code == 201, response.text
    pending = response.json()
    assert pending["status"] == "pendiente"
    assert pending["amount_gtq"] == 775
    confirm_url = f"{TRANSACTIONS}{pending['id']}/confirm"

    assert list_transactions(client, sender)["items"] == [pending]
    assert list_transactions(client, beneficiary)["items"] == [pending]
    assert list_transactions(client, other)["total"] == 0
    assert client.patch(confirm_url, headers=sender).status_code == 403
    assert client.patch(confirm_url, headers=other).status_code == 404

    response = client.patch(confirm_url, headers=beneficiary)
    assert response.status_code == 200, response.text
    confirmed = response.json()
    assert confirmed["status"] == "confirmado"
    assert client.patch(confirm_url, headers=beneficiary).json() == confirmed
    assert list_transactions(client, sender)["items"] == [confirmed]

    response = client.post(
        TRANSACTIONS, headers=beneficiary, json={"type": "solicitud", "amount_gtq": 77.5}
    )
    assert response.status_code == 201, response.text
    request = response.json()
    assert request["beneficiary_id"] is None
    assert client.patch(f"{TRANSACTIONS}{request['id']}/confirm", headers=beneficiary).status_code == 404

    history = list_transactions(client, beneficiary, page=2, page_size=1)
    assert history["total"] == 2
    assert history["items"] == [confirmed]
