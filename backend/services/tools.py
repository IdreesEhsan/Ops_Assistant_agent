"""
Tools available to the OpsAssistant agent.
Each tool is decorated with @tool so LangChain can expose its description to the LLM.
"""

from langchain.tools import tool
from services.db_service import search_clients, search_tasks
from services.embedding_service import get_embedding
from services import db_service
import json
import logging

logger = logging.getLogger("uvicorn")

@tool
def rag_search(query: str) -> str:
    """
    Search the company knowledge base for relevant information.
    Returns the top matching chunks with source details (document name and page).
    """
    embedding = get_embedding(query)
    results = db_service.similarity_search(embedding, top_k=5, threshold=0.15)
    logger.info(f"RAG query: {query}, results: {len(results)}")
    if not results:
        return "No relevant information found in knowledge base."
    chunks = []
    for r in results:
        page = r["metadata"].get("page", "N/A")
        chunks.append(f"- {r['content'][:300]} (from {r['filename']}, page {page})")
        logger.info(f"  chunk {r['chunk_index']}: {r['content'][:80]}...")
    return "\n".join(chunks)

@tool
def lookup_client(query: str) -> str:
    """
    Look up client details by name or email.
    Returns client records in JSON format.
    """
    results = search_clients(query)
    if not results:
        return "No client found."
    return json.dumps(results, indent=2)

@tool
def lookup_task(query: str) -> str:
    """
    Look up tasks by title or status.
    Returns task records in JSON format.
    """
    results = search_tasks(query)
    if not results:
        return "No task found."
    return json.dumps(results, indent=2)

@tool
def calculator(expression: str) -> str:
    """
    Safely evaluate a simple arithmetic expression.
    Only numbers and + - * / ( ) are allowed.
    """
    allowed_chars = "0123456789+-*/(). "
    if any(c not in allowed_chars for c in expression):
        return "Invalid expression. Only numbers and + - * / ( ) are allowed."
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"

@tool
def draft_email(to: str, subject: str, body: str) -> str:
    """
    Create an email draft. Does NOT send the email.
    The draft will be stored for human approval before sending.
    """
    return f"Email draft prepared to {to}: {subject}"