from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from config import settings

# Main LLM for agent responses
llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_MODEL,
    temperature=0.3,
    streaming=True
)

# Separate LLM for title generation (can be a faster/cheaper model)
title_llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_TITLE_MODEL,
    temperature=0.2,
    streaming=False
)

def get_llm():
    """Return the main LLM instance."""
    return llm

async def generate_chat_title(user_message: str) -> str | None:
    """
    Generate a concise 3-5 word title for a chat session using the dedicated title LLM.
    Returns cleaned title or None if generation fails.
    """
    messages = [
        SystemMessage(content="Generate a concise 3-5 word title for the following conversation. Return only the title, no quotes or punctuation."),
        HumanMessage(content=user_message)
    ]
    try:
        response = await title_llm.ainvoke(messages)
        title = response.content.strip().replace('"', '').replace("'", "").strip()
        return title if title else None
    except Exception as e:
        print(f"Title generation failed: {e}")
        return None