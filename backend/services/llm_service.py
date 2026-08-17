from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from config import settings

# Initialize the LLM once
llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_MODEL,
    temperature=0.3,
    streaming=True
)

def get_llm():
    """Return the shared LLM instance."""
    return llm

async def generate_chat_title(user_message: str) -> str:
    """
    Generate a short, concise title for a chat session using the LLM.
    Returns the title as a string (without quotes or extra punctuation).
    """
    messages = [
        SystemMessage(content="Generate a concise 3-5 word title for the following conversation. Return only the title, no quotes or punctuation."),
        HumanMessage(content=user_message)
    ]
    try:
        response = await llm.ainvoke(messages)
        title = response.content.strip()
        # Clean up any quotes or stray characters
        title = title.replace('"', '').replace("'", "").strip()
        return title if title else None
    except Exception as e:
        # Log and return None so the caller can fall back
        print(f"Title generation failed: {e}")
        return None