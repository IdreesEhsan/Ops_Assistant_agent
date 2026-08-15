from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, CreateSessionRequest
from services.agent import app
from dependencies import get_current_user
from services import db_service
from langchain_core.messages import HumanMessage, AIMessage
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ---------- Session management ----------
@router.get("/sessions")
def list_sessions(user=Depends(get_current_user)):
    """Return all chat sessions for the user."""
    return db_service.get_all_sessions(user.id)

@router.post("/sessions")
def create_session(request: CreateSessionRequest, user=Depends(get_current_user)):
    """Create a new chat session."""
    return db_service.create_chat_session(user.id, request.system_prompt, request.title)

@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str, user=Depends(get_current_user)):
    """Retrieve messages in a session."""
    return db_service.get_session_messages(session_id)

# ---------- Main agent chat endpoint ----------
@router.post("")
async def chat_endpoint(request: ChatRequest, user=Depends(get_current_user)):
    """
    Process a user message through the LangGraph agent.
    Returns a streaming response with the final assistant message.
    """
    session_id = request.session_id
    if not session_id:
        session = db_service.create_chat_session(user.id, system_prompt=request.system_prompt)
        session_id = session["id"]

    # Save user message
    user_msg = request.messages[-1].content
    db_service.save_message(session_id, role="user", content=user_msg)

    # Convert chat history to LangChain messages
    lc_messages = []
    for m in request.messages:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        else:
            lc_messages.append(AIMessage(content=m.content))

    # Run agent with thread_id = session_id for memory
    config = {"configurable": {"thread_id": session_id}}
    result = await app.ainvoke(
        {"messages": lc_messages, "session_id": session_id, "user_id": user.id},
        config
    )

    final_message = result["messages"][-1].content
    db_service.save_message(session_id, role="assistant", content=final_message)

    # Stream the response back
    async def generate():
        yield f"data: {json.dumps({'session_id': session_id})}\n\n"
        yield f"data: {json.dumps({'content': final_message})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")