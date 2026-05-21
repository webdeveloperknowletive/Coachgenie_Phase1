import httpx


class CopilotClient:

    BASE_URL = (
        "http://localhost:8001"
    )

    @classmethod
    async def chat(
        cls,
        *,
        user_id: str,
        message: str,
    ):

        async with httpx.AsyncClient() as client:

            response = await client.post(

                f"{cls.BASE_URL}/copilot/chat",

                json={
                    "user_id": user_id,
                    "message": message,
                },

                timeout=60,
            )

            response.raise_for_status()

            return response.json()