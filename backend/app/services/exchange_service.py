from datetime import datetime
from math import isfinite

import httpx

FRANKFURTER_RATE_URL = "https://api.frankfurter.dev/v2/rate/USD/GTQ"
FALLBACK_RATE = 7.75


async def get_exchange_rate(date: datetime | None = None) -> float:
    params = {"date": date.date().isoformat()} if date else None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(FRANKFURTER_RATE_URL, params=params)
            response.raise_for_status()
            rate = response.json()["rate"]
        if type(rate) in (int, float) and isfinite(rate) and rate > 0:
            return float(rate)
    except (httpx.HTTPError, KeyError, OverflowError, TypeError, ValueError):
        return FALLBACK_RATE

    return FALLBACK_RATE
