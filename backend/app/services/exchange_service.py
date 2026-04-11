import httpx
from datetime import datetime

FRANKFURTER_URL = "https://api.frankfurter.app"

async def get_exchange_rate(date: datetime | None = None) -> float:
    async with httpx.AsyncClient() as client:
        try:
            if date:
                date_str = date.strftime("%Y-%m-%d")
                url = f"{FRANKFURTER_URL}/{date_str}"
            else:
                url = f"{FRANKFURTER_URL}/latest"

            response = await client.get(url, params={
                "from": "USD",
                "to": "GTQ"
            })
            response.raise_for_status()
            data = response.json()
            return data["rates"]["GTQ"]

        except httpx.HTTPError:
            # Fallback rate si la API falla
            return 7.75