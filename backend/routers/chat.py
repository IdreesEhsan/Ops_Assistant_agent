# (at top)
from services.llm_service import generate_chat_title
import asyncio, logging

logger = logging.getLogger("uvicorn")

async def generate_and_update_title(session_id: str, user_message: str):
    try:
        title = await generate_chat_title(user_message)
        if title:
            db_service.update_session_title(session_id, title)
        else:
            # Fallback: first 6 words
            fallback = " ".join(user_message.strip().split()[:6])
            db_service.update_session_title(session_id, fallback)
    except Exception as e:
        logger.error(f"Title update failed: {e}")
        fallback = " ".join(user_message.strip().split()[:6])
        db_service.update_session_title(session_id, fallback)