from config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_or_create_user(email: str):
    # Dummy user logic for this prototype without auth
    res = supabase.table("users").select("*").eq("email", email).execute()
    if not res.data:
        res = supabase.table("users").insert({"email": email}).execute()
    return res.data[0]["id"]

def create_chat_session(user_id: str, title: str):
    res = supabase.table("chat_sessions").insert({
        "user_id": user_id,
        "title": title
    }).execute()
    return res.data[0]["id"]

def get_chat_sessions(user_id: str):
    res = supabase.table("chat_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data

def get_chat_history(session_id: str):
    res = supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at", desc=False).execute()
    return res.data

def add_chat_message(session_id: str, role: str, content: str, sources: list = None):
    res = supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content,
        "sources": sources or []
    }).execute()
    return res.data[0]

def log_query(user_id: str, query_text: str):
    supabase.table("queries").insert({
        "user_id": user_id,
        "query_text": query_text
    }).execute()

def delete_chat_session(session_id: str):
    supabase.table("chat_messages").delete().eq("session_id", session_id).execute()
    res = supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    return res.data

