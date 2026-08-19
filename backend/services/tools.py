"""
Tools available to the OpsAssistant agent.
Each tool is decorated with @tool so LangChain can expose its description to the LLM.
"""

from langchain.tools import tool
from services.db_service import (
    search_clients,
    search_tasks,
    add_client as db_add_client,
    add_task as db_add_task
)
from services.embedding_service import get_embedding
from services import db_service
import ast
import math
import json
import logging

logger = logging.getLogger("uvicorn")

# ---------- Helper: Safe scientific calculator ----------
ALLOWED_FUNCTIONS = {
    'sin': math.sin,
    'cos': math.cos,
    'tan': math.tan,
    'asin': math.asin,
    'acos': math.acos,
    'atan': math.atan,
    'atan2': math.atan2,
    'sqrt': math.sqrt,
    'log': math.log,
    'log10': math.log10,
    'exp': math.exp,
    'sinh': math.sinh,
    'cosh': math.cosh,
    'tanh': math.tanh,
    'degrees': math.degrees,
    'radians': math.radians,
    'fabs': math.fabs,
    'floor': math.floor,
    'ceil': math.ceil,
    'factorial': math.factorial,
    'gcd': math.gcd,
    'pow': math.pow,
}

ALLOWED_CONSTANTS = {
    'pi': math.pi,
    'e': math.e,
    'tau': math.tau,
}

def _is_safe_node(node):
    """Validate AST node to allow only arithmetic and math functions."""
    if isinstance(node, ast.Expression):
        return _is_safe_node(node.body)
    elif isinstance(node, ast.BinOp):
        return _is_safe_node(node.left) and _is_safe_node(node.right)
    elif isinstance(node, ast.UnaryOp):
        return _is_safe_node(node.operand)
    elif isinstance(node, ast.Constant):
        # Only allow int, float, bool
        return isinstance(node.value, (int, float))
    elif isinstance(node, ast.Name):
        return node.id in ALLOWED_CONSTANTS
    elif isinstance(node, ast.Call):
        return (
            isinstance(node.func, ast.Name)
            and node.func.id in ALLOWED_FUNCTIONS
            and all(_is_safe_node(arg) for arg in node.args)
        )
    else:
        return False

def safe_eval(expression: str):
    """
    Safely evaluate a mathematical expression using AST validation.
    Supports arithmetic, trigonometric, logarithmic, and other scientific functions.
    Returns the result as a string, or an error message.
    """
    try:
        parsed = ast.parse(expression, mode='eval')
        if not _is_safe_node(parsed):
            return "Invalid expression. Only arithmetic, trigonometric, logarithmic, and scientific functions are allowed."
        # Evaluate with restricted globals
        globals_dict = {"__builtins__": None}
        globals_dict.update(ALLOWED_FUNCTIONS)
        globals_dict.update(ALLOWED_CONSTANTS)
        result = eval(compile(parsed, "<string>", "eval"), globals_dict)
        return str(result)
    except SyntaxError:
        return "Invalid syntax."
    except Exception as e:
        return f"Error: {str(e)}"

# ---------- Tools ----------

@tool
def rag_search(query: str) -> str:
    """
    Search the company knowledge base for relevant information.
    Returns the top matching chunks with source details (document name and page).
    """
    print(f"📄 RAG Search query: {query}")
    embedding = get_embedding(query)
    results = db_service.similarity_search(embedding, top_k=5, threshold=0.15)
    print(f"   RAG results: {len(results)} chunks")
    if not results:
        return "No relevant information found in knowledge base."
    chunks = []
    for r in results:
        page = r["metadata"].get("page", "N/A")
        chunks.append(f"- {r['content'][:300]} (from {r['filename']}, page {page})")
        print(f"   chunk {r['chunk_index']}: {r['content'][:80]}...")
    return "\n".join(chunks)

@tool
def lookup_client(query: str = "") -> str:
    """
    Look up clients by name or email. Use query 'all' to list all clients.
    Returns a readable summary.
    """
    print(f"🔍 lookup_client called with query: {query}")
    results = search_clients(query)
    if not results:
        return "No client found."

    lines = []
    for client in results:
        lines.append(
            f"Name: {client.get('name', '')}\n"
            f"Email: {client.get('email', '')}\n"
            f"Company: {client.get('company', '') or 'N/A'}\n"
            f"Status: {client.get('status', '')}\n"
        )
    return "\n".join(lines)

@tool
def add_client(name: str, email: str, company: str = "", status: str = "active") -> str:
    """
    Add a new client to the database. Use this when the user wants to create a client record.
    """
    print(f"➕ add_client called: {name}, {email}")
    result = db_add_client(name, email, company, status)
    if result:
        return f"Client added: {result['name']} ({result['email']})"
    return "Failed to add client."

@tool
def lookup_task(query: str = "") -> str:
    """
    Look up tasks by title, client name, or use query 'all' to list all tasks.
    Returns a readable summary including client name.
    """
    print(f"🔍 lookup_task called with query: {query}")
    results = search_tasks(query)
    if not results:
        return "No tasks found."

    lines = []
    for task in results:
        client_info = task.get("clients") or {}
        client_name = client_info.get("name", "Unknown")
        client_email = client_info.get("email", "")
        due = task.get("due_date") or "None"
        lines.append(
            f"Title: {task.get('title', '')}\n"
            f"Client: {client_name} ({client_email})\n"
            f"Status: {task.get('status', '')}\n"
            f"Due Date: {due}\n"
        )
    return "\n".join(lines)

@tool
def add_task(title: str, client_email: str, status: str = "pending", due_date: str = None) -> str:
    """
    Add a new task for a client (looked up by email). Use this when the user wants to create a task.
    """
    print(f"➕ add_task called: {title} for {client_email}")
    result = db_add_task(title, client_email, status, due_date)
    if result:
        return f"Task added: {result['title']} for client {client_email}"
    return "Failed to add task. Client not found."

@tool
def calculator(expression: str) -> str:
    """
    Evaluate a mathematical expression. Supports basic arithmetic (+, -, *, /, **, %),
    trigonometric functions (sin, cos, tan, asin, acos, atan),
    logarithmic functions (log, log10), exponential (exp), square root (sqrt),
    constants (pi, e), and other scientific functions.
    Returns the numerical result as a string.
    """
    print(f"🧮 calculator called with expression: {expression}")
    result = safe_eval(expression)
    print(f"   Result: {result}")
    return result

@tool
def draft_email(to: str, subject: str, body: str) -> str:
    """
    Create an email draft. Does NOT send the email.
    The draft will be stored for human approval before sending.
    """
    print(f"✉️ draft_email called to: {to}, subject: {subject}")
    return f"Email draft prepared to {to}: {subject}"

@tool
def update_draft(to: str, subject: str, body: str) -> str:
    """
    Update the existing email draft for the current session. Use this when the user wants to modify the draft already created.
    """
    print(f"✏️ update_draft called to: {to}, subject: {subject}")
    return f"Draft updated for {to}: {subject}"