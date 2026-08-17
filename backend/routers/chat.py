from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, CreateSessionRequest
from services.agent import app
from services.llm_service import generate_chat_title
from dependencies import get_current_user
from services import db_service
from langchain_core.messages import HumanMessage, AIMessage, AIMessageChunk
import json
import asyncio
import logging

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger("uvicorn")

async def generate_and_update_title(session_id: str, user_message: str):
    try:
        title = await generate_chat_title(user_message)
        if title:
            db_service.update_session_title(session_id, title)
        else:
            fallback = " ".join(user_message.strip().split()[:6])
            db_service.update_session_title(session_id, fallback)
    except Exception as e:
        logger.error(f"Title update failed: {e}")
        fallback = " ".join(user_message.strip().split()[:6])
        db_service.update_session_title(session_id, fallback)

# ---------- Session management ----------
@router.get("/sessions")
def list_sessions(user=Depends(get_current_user)):
    return db_service.get_all_sessions(user.id)

@router.post("/sessions")
def create_session(request: CreateSessionRequest, user=Depends(get_current_user)):
    return db_service.create_chat_session(user.id, request.system_prompt, request.title)

@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str, user=Depends(get_current_user)):
    return db_service.get_session_messages(session_id)

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, user=Depends(get_current_user)):
    try:
        existing = (
            db_service.supabase.table("chat_sessions")
            .select("*")
            .eq("id", session_id)
            .eq("user_id", user.id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Session not found")

        db_service.supabase.table("chat_sessions").delete().eq("id", session_id).execute()
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Main agent chat endpoint ----------
@router.post("")
async def chat_endpoint(request: ChatRequest, user=Depends(get_current_user)):
    session_id = request.session_id
    if not session_id:
        session = db_service.create_chat_session(user.id, system_prompt=request.system_prompt)
        session_id = session["id"]

    user_msg = request.messages[-1].content
    db_service.save_message(session_id, role="user", content=user_msg)

    if not request.session_id:
        asyncio.create_task(generate_and_update_title(session_id, user_msg))

    lc_messages = []
    for m in request.messages:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        else:
            lc_messages.append(AIMessage(content=m.content))

    async def stream_agent_response():
        full_response = ""
        yield f"data: {json.dumps({'session_id': session_id})}\n\n"

        config = {"configurable": {"thread_id": session_id}}
        try:
            # IMPORTANT: reset rag_sources for this turn
            initial_state = {
                "messages": lc_messages,
                "session_id": session_id,
                "user_id": user.id,
                "rag_sources": []      # clears previous turn's sources
            }

            async for message_chunk, metadata in app.astream(
                initial_state,
                config,
                stream_mode="messages"
            ):
                if isinstance(message_chunk, AIMessageChunk) and message_chunk.content:
                    token = message_chunk.content
                    full_response += token
                    yield f"data: {json.dumps({'content': token})}\n\n"

            # After streaming, get final state (with current turn's sources)
            final_state = await app.aget_state(config)
            rag_sources = final_state.values.get("rag_sources", [])
            yield f"data: {json.dumps({'sources': rag_sources})}\n\n"

        except Exception as e:
            logger.error(f"Agent streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        if full_response:
            db_service.save_message(session_id, role="assistant", content=full_response)
        else:
            fallback = "I couldn't generate a response. Please try again."
            db_service.save_message(session_id, role="assistant", content=fallback)
            yield f"data: {json.dumps({'content': fallback})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_agent_response(), media_type="text/event-stream")