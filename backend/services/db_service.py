from supabase import create_client
from config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# ---------- Chat sessions ----------
def create_chat_session(user_id, system_prompt, title="New Chat"):
    """Create a new chat session."""
    res = supabase.table("chat_sessions").insert({
        "user_id": user_id,
        "system_prompt": system_prompt,
        "title": title
    }).execute()
    return res.data[0] if res.data else None

def save_message(session_id, role, content):
    """Save a message in a session."""
    supabase.table("messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content
    }).execute()

def get_session_messages(session_id):
    """Get all messages in a session ordered by creation time."""
    res = supabase.table("messages").select("*").eq("session_id", session_id).order("created_at").execute()
    return res.data

def get_all_sessions(user_id):
    """Get all sessions for a user, newest first."""
    res = supabase.table("chat_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

def update_session_title(session_id, new_title):
    """Update the title of a session (used for auto-generated titles)."""
    supabase.table("chat_sessions").update({"title": new_title}).eq("id", session_id).execute()

# ---------- Documents & chunks ----------
def create_document(user_id, filename):
    """Create a document record."""
    res = supabase.table("documents").insert({"user_id": user_id, "filename": filename}).execute()
    return res.data[0]

def insert_chunk(document_id, chunk_index, content, embedding, metadata):
    """Store a chunk with its embedding and metadata."""
    supabase.table("chunks").insert({
        "document_id": document_id,
        "chunk_index": chunk_index,
        "content": content,
        "embedding": embedding,
        "metadata": metadata
    }).execute()

def delete_document(doc_id):
    """Delete a document (chunks cascade automatically)."""
    supabase.table("documents").delete().eq("id", doc_id).execute()

def get_user_documents(user_id):
    """Get all documents for a user."""
    res = supabase.table("documents").select("*").eq("user_id", user_id).execute()
    return res.data

# ---------- Vector search ----------
def similarity_search(query_embedding, top_k=7, threshold=0.15):
    """Perform similarity search using the match_chunks RPC."""
    res = supabase.rpc("match_chunks", {
        "query_embedding": query_embedding,
        "match_threshold": threshold,
        "match_count": top_k
    }).execute()
    return res.data

# ---------- Structured data (clients, tasks) ----------
def search_clients(query, limit=5):
    """Search clients by name using ilike."""
    res = supabase.table("clients").select("*").ilike("name", f"%{query}%").limit(limit).execute()
    return res.data

def search_tasks(query, limit=5):
    """Search tasks by title using ilike."""
    res = supabase.table("tasks").select("*").ilike("title", f"%{query}%").limit(limit).execute()
    return res.data

# ---------- Email logs ----------
def create_email_log(session_id, user_id, draft_json):
    """Create an email log entry with status 'draft'."""
    res = supabase.table("email_logs").insert({
        "session_id": session_id,
        "user_id": user_id,
        "draft_json": draft_json,
        "status": "draft"
    }).execute()
    return res.data[0] if res.data else None

def get_pending_emails(user_id):
    """Get all emails with status 'draft' for a user."""
    res = supabase.table("email_logs").select("*").eq("user_id", user_id).eq("status", "draft").execute()
    return res.data

def update_email_status(email_log_id, status):
    """Update the status of an email log."""
    supabase.table("email_logs").update({"status": status}).eq("id", email_log_id).execute()