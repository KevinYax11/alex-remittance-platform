import asyncio
from datetime import datetime
from functools import partial

import httpx
import pytest

from app.services.exchange_service import get_exchange_rate


@pytest.fixture
def mock_frankfurter(monkeypatch):
    def configure(handler):
        client = partial(httpx.AsyncClient, transport=httpx.MockTransport(handler))
        monkeypatch.setattr(httpx, "AsyncClient", client)

    return configure


@pytest.mark.parametrize("date", [None, datetime(2026, 4, 10)])
def test_reads_reference_rate(mock_frankfurter, date):
    def respond(request):
        assert request.url.host == "api.frankfurter.dev"
        assert request.url.path == "/v2/rate/USD/GTQ"
        expected = {"date": "2026-04-10"} if date else {}
        assert dict(request.url.params) == expected
        return httpx.Response(200, json={"rate": 7.662})

    mock_frankfurter(respond)
    assert asyncio.run(get_exchange_rate(date)) == 7.662


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(503),
        httpx.Response(200, text="invalid JSON"),
        httpx.Response(200, json={}),
        httpx.Response(200, json={"rate": 0}),
        httpx.Response(200, json={"rate": "7.662"}),
    ],
)
def test_uses_fallback_when_response_is_unusable(mock_frankfurter, response):
    mock_frankfurter(lambda request: response)
    assert asyncio.run(get_exchange_rate()) == 7.75


def test_uses_fallback_when_request_fails(mock_frankfurter):
    def respond(request):
        raise httpx.ConnectError("Unavailable", request=request)

    mock_frankfurter(respond)
    assert asyncio.run(get_exchange_rate()) == 7.75
