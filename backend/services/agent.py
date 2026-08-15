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
from services.llm_service import get_llm
from services.tools import rag_search, lookup_client, lookup_task, calculator, draft_email
from services.email_service import create_draft
from prompts.agent_prompt import SYSTEM_PROMPT

# All tools available to the agent
tools = [rag_search, lookup_client, lookup_task, calculator, draft_email]
tool_map = {t.name: t for t in tools}

class AgentState(TypedDict):
    """
    State shared across graph nodes.
    - messages: list of LangChain messages (conversation memory)
    - session_id: database session ID for saving messages/email logs
    - user_id: authenticated user ID
    - pending_draft: stores the email draft awaiting approval
    - status: controls flow: 'continue', 'await_approval', or 'end'
    """
    messages: Annotated[List, add_messages]
    session_id: str
    user_id: str
    pending_draft: dict | None
    status: str

def agent_node(state: AgentState):
    """
    The LLM node – calls the model with system prompt and current messages.
    The model may request tool calls.
    """
    llm = get_llm()
    llm_with_tools = llm.bind_tools(tools)
    # Prepend system prompt so rules are always present
    messages = [HumanMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def tool_node(state: AgentState):
    """
    Executes tool calls made by the LLM.
    Special handling for draft_email to create a real draft and trigger approval.
    """
    last_message = state["messages"][-1]
    outputs = []
    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        if tool_name == "draft_email":
            # Create a draft record and pause for human approval
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
                "status": "await_approval"
            }
        else:
            # Execute normal tool
            tool = tool_map[tool_name]
            result = tool.invoke(tool_args)
            outputs.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))

    return {"messages": outputs, "status": "continue"}

def should_continue(state: AgentState) -> Literal["tools", "end"]:
    """
    Decide next node:
    - If awaiting approval, stop.
    - If last message has tool calls, go to tools.
    - Otherwise, end.
    """
    if state.get("status") == "await_approval":
        return "end"
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tools"
    return "end"

# Build the graph
graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)

graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
graph.add_edge("tools", "agent")

# In‑memory checkpointer to maintain conversation state across turns.
# For production, replace with a persistent checkpointer.
memory = MemorySaver()
app = graph.compile(checkpointer=memory)