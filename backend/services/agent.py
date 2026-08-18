"""
LangGraph agent for OpsAssistant.
Defines the agent state, nodes, and graph structure.
Includes a human-in-the-loop approval step for email drafts.
"""

from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from typing import Annotated, TypedDict, List, Literal
import re
from services.llm_service import get_llm
from services.tools import rag_search, lookup_client, lookup_task, calculator, draft_email
from services.email_service import create_draft
from prompts.agent_prompt import SYSTEM_PROMPT

tools = [rag_search, lookup_client, lookup_task, calculator, draft_email]
tool_map = {t.name: t for t in tools}

class AgentState(TypedDict):
    messages: Annotated[List, add_messages]
    session_id: str
    user_id: str
    pending_draft: dict | None
    status: str
    rag_sources: List[dict]          # normal field, overwritten each turn


def extract_sources_from_rag_output(content: str) -> List[dict]:
    sources = []
    for line in content.split("\n"):
        match = re.search(r'\(from\s+([^,]+),\s*page\s+([^)]+)\)', line)
        if match:
            sources.append({
                "filename": match.group(1).strip(),
                "page": match.group(2).strip()
            })
    return sources


def agent_node(state: AgentState):
    llm = get_llm()
    llm_with_tools = llm.bind_tools(tools)
    messages = [HumanMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def tool_node(state: AgentState):
    last_message = state["messages"][-1]
    outputs = []
    new_rag_sources = []

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        # ✅ Log tool call to backend console
        print(f"🔧 Tool called: {tool_name} with args: {tool_args}")

        if tool_name == "draft_email":
            draft = {
                "to": tool_args.get("to"),
                "subject": tool_args.get("subject"),
                "body": tool_args.get("body")
            }
            create_draft(
                session_id=state["session_id"],
                user_id=state["user_id"],
                to=draft["to"],
                subject=draft["subject"],
                body=draft["body"]
            )
            outputs.append(ToolMessage(
                content=f"Draft created and awaiting approval. Email to {draft['to']} is not sent yet.",
                tool_call_id=tool_call["id"]
            ))
            return {
                "messages": outputs,
                "pending_draft": draft,
                "status": "await_approval",
                "rag_sources": new_rag_sources
            }
        else:
            tool = tool_map[tool_name]
            result = tool.invoke(tool_args)
            outputs.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))

            if tool_name == "rag_search":
                sources = extract_sources_from_rag_output(str(result))
                new_rag_sources.extend(sources)

    return {
        "messages": outputs,
        "status": "continue",
        "rag_sources": new_rag_sources
    }


def should_continue(state: AgentState) -> Literal["tools", "end"]:
    if state.get("status") == "await_approval":
        return "end"
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tools"
    return "end"


graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)

graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
graph.add_edge("tools", "agent")

memory = MemorySaver()
app = graph.compile(checkpointer=memory)