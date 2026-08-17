from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, CreateSessionRequest
from services.agent import app
from services.llm_service import generate_chat_title
from dependencies import get_current_user
from services import db_service
from langchain_core.messages import HumanMessage, AIMessage, AIMessageChunk, ToolMessage
import json
import asyncio
import logging
import re

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

@router.post("")
async def chat_endpoint(request: ChatRequest, user=Depends(get_current_user)):
    session_id = request.session_id
    if not session_id:
        session = db_service.create_chat_session(user.id, system_prompt=request.system_prompt)
        session_id = session["id"]

    user_msg = request.messages[-1].content
    db_service.save_message(session_id, role="user", content=user_msg, sources=[])

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
        current_turn_sources = []
        # Map tool_call_id -> tool_name
        tool_call_map = {}

        yield f"data: {json.dumps({'session_id': session_id})}\n\n"

        config = {"configurable": {"thread_id": session_id}}
        try:
            async for message_chunk, metadata in app.astream(
                {"messages": lc_messages, "session_id": session_id, "user_id": user.id, "rag_sources": []},
                config,
                stream_mode="messages"
            ):
                # 1) Accumulate tool call IDs from AIMessageChunk
                if isinstance(message_chunk, AIMessageChunk):
                    # tool_call_chunks may be present
                    if hasattr(message_chunk, "tool_call_chunks") and message_chunk.tool_call_chunks:
                        for tc_chunk in message_chunk.tool_call_chunks:
                            if tc_chunk.get("id") and tc_chunk.get("name"):
                                tool_call_map[tc_chunk["id"]] = tc_chunk["name"]

                    # stream content
                    if message_chunk.content:
                        token = message_chunk.content
                        full_response += token
                        yield f"data: {json.dumps({'content': token})}\n\n"

                # 2) ToolMessage: match with tool_call_map to know if it's rag_search
                elif isinstance(message_chunk, ToolMessage):
                    tool_name = tool_call_map.get(message_chunk.tool_call_id, "")
                    if tool_name == "rag_search":
                        for line in message_chunk.content.split("\n"):
                            match = re.search(r'\(from\s+([^,]+),\s*page\s+([^)]+)\)', line)
                            if match:
                                current_turn_sources.append({
                                    "filename": match.group(1).strip(),
                                    "page": match.group(2).strip()
                                })

            # After stream ends, save assistant message with sources
            if full_response:
                db_service.save_message(session_id, role="assistant", content=full_response, sources=current_turn_sources)
            else:
                fallback = "I couldn't generate a response. Please try again."
                db_service.save_message(session_id, role="assistant", content=fallback, sources=[])
                yield f"data: {json.dumps({'content': fallback})}\n\n"

            # Send sources to frontend
            yield f"data: {json.dumps({'sources': current_turn_sources})}\n\n"

        except Exception as e:
            logger.error(f"Agent streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_agent_response(), media_type="text/event-stream")