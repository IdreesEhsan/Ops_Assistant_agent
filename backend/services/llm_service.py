from langchain_groq import ChatGroq
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