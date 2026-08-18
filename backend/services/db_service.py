from supabase import create_client
from config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# ---------- Chat / Session ----------
def create_chat_session(user_id: str, system_prompt: str, title: str = "New Chat"):
    res = supabase.table("chat_sessions").insert({
        "user_id": user_id,
        "system_prompt": system_prompt,
        "title": title
    }).execute()
    return res.data[0] if res.data else None

def save_message(session_id: str, role: str, content: str, sources: list = []):
    supabase.table("messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content,
        "sources": sources
    }).execute()

def get_session_messages(session_id: str):
    res = supabase.table("messages").select("*").eq("session_id", session_id).order("created_at").execute()
    return res.data

def get_all_sessions(user_id: str):
    res = supabase.table("chat_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

def update_session_title(session_id: str, new_title: str):
    supabase.table("chat_sessions").update({"title": new_title}).eq("id", session_id).execute()

# ---------- Documents / Chunks ----------
def create_document(user_id: str, filename: str):
    res = supabase.table("documents").insert({"user_id": user_id, "filename": filename}).execute()
    return res.data[0]

def insert_chunk(document_id: str, chunk_index: int, content: str,
                 embedding: list[float], metadata: dict):
    supabase.table("chunks").insert({
        "document_id": document_id,
        "chunk_index": chunk_index,
        "content": content,
        "embedding": embedding,
        "metadata": metadata
    }).execute()

def delete_document(doc_id: str):
    supabase.table("documents").delete().eq("id", doc_id).execute()

def get_user_documents(user_id: str):
    res = supabase.table("documents").select("*").eq("user_id", user_id).execute()
    return res.data

# ---------- Vector Search ----------
def similarity_search(query_embedding: list[float], top_k: int = 7,
                     threshold: float = 0.15):
    res = supabase.rpc("match_chunks", {
        "query_embedding": query_embedding,
        "match_threshold": threshold,
        "match_count": top_k
    }).execute()
    return res.data

# ---------- Structured data (clients, tasks) ----------
def search_clients(query: str, limit: int = 5):
    res = supabase.table("clients").select("*").ilike("name", f"%{query}%").limit(limit).execute()
    return res.data

def search_tasks(query: str, limit: int = 5):
    res = supabase.table("tasks").select("*").ilike("title", f"%{query}%").limit(limit).execute()
    return res.data

# ---------- Email logs ----------
def create_email_log(session_id: str, user_id: str, draft_json: dict):
    res = supabase.table("email_logs").insert({
        "session_id": session_id,
        "user_id": user_id,
        "draft_json": draft_json,
        "status": "draft"
    }).execute()
    return res.data[0] if res.data else None

def get_pending_emails(user_id: str):
    res = supabase.table("email_logs").select("*").eq("user_id", user_id).eq("status", "draft").execute()
    return res.data

def update_email_status(email_log_id: str, status: str):
    supabase.table("email_logs").update({"status": status}).eq("id", email_log_id).execute()

# NEW
def get_latest_draft(session_id: str, user_id: str):
    res = supabase.table("email_logs") \
        .select("*") \
        .eq("session_id", session_id) \
        .eq("user_id", user_id) \
        .eq("status", "draft") \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    return res.data[0] if res.data else None

def update_draft(email_log_id: str, draft_json: dict):
    supabase.table("email_logs").update({"draft_json": draft_json}).eq("id", email_log_id).execute()