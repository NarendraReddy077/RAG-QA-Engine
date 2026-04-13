from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from models import ChatRequest, ChatResponse
import traceback
import os

from config import settings

router = APIRouter()

@router.post("/ingest")
async def ingest_data(text: str = Form(None), url: str = Form(None), file: UploadFile = File(None)):
    try:
        if file:
            file_path = f"temp_{file.filename}"
            with open(file_path, "wb") as f:
                f.write(await file.read())
            from services.rag import ingest_pdf
            ingest_pdf(file_path)
            os.remove(file_path)
        elif text:
            from services.rag import ingest_text
            ingest_text(text, "custom_text")
        elif url:
            from services.rag import ingest_url
            ingest_url(url)
        else:
            raise HTTPException(status_code=400, detail="Must provide text, url, or file")
        return {"message": "Data ingested successfully"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    try:
        from services.db import get_or_create_user, create_chat_session, add_chat_message, log_query
        from services.rag import query_rag
        
        user_id = get_or_create_user(settings.DUMMY_EMAIL)
        log_query(user_id, request.query)
        
        session_id = request.session_id
        if not session_id:
            title = "Chat: " + request.query[:20]
            session_id = create_chat_session(user_id, title)
            
        add_chat_message(session_id, "user", request.query)
        
        answer, sources = query_rag(request.query)
            
        add_chat_message(session_id, "assistant", answer, sources)
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            session_id=str(session_id)
        )
    except Exception as e:
        print("====== ERROR IN /chat ======")
        traceback.print_exc()
        print("============================")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def history_endpoint():
    try:
        from services.db import get_or_create_user, get_chat_sessions
        user_id = get_or_create_user(settings.DUMMY_EMAIL)
        sessions = get_chat_sessions(user_id)
        return {"sessions": sessions}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}")
def session_messages(session_id: str):
    from services.db import get_chat_history
    messages = get_chat_history(session_id)
    return {"messages": messages}

@router.delete("/history/{session_id}")
def delete_history(session_id: str):
    try:
        from services.db import delete_chat_session
        delete_chat_session(session_id)
        return {"message": "Session deleted"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/knowledge")
def get_knowledge():
    try:
        from services.rag import get_all_knowledge
        sources = get_all_knowledge()
        return {"sources": sources}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/knowledge")
def delete_knowledge_endpoint(source: str):
    try:
        from services.rag import delete_knowledge
        deleted_count = delete_knowledge(source)
        return {"message": f"Deleted {deleted_count} chunks for source '{source}'"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

