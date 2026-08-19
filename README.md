# OpsAssistant

OpsAssistant is an operations agent that answers company questions from a knowledge base, looks up structured data (clients, tasks), performs calculations, and drafts emails — with memory, guardrails, and a human approval step before sending.

## Features

- 🔐 Authentication via Supabase (email/password, JWT)
- 📄 Document upload & RAG search (pgvector + local embeddings)
- 👥 Structured data lookup and insertion (clients, tasks)
- 🧮 Calculator
- ✉️ Email drafting with human‑in‑the‑loop approval (real SMTP sending)
- 🧠 Memory across turns (LangGraph)
- 🛡️ Guardrails: refusal rules, tool‑error recovery, max‑step limits, injection resistance
- 📊 LangSmith tracing for observability

## Tech Stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Frontend       | React, Vite, Lucide icons            |
| Backend        | FastAPI, LangChain, LangGraph        |
| LLM            | Groq (`openai/gpt-oss-120b`)         |
| Embeddings     | `all-MiniLM-L6-v2` (384‑dim)         |
| Vector DB      | Supabase pgvector                    |
| Database       | Supabase (PostgreSQL, Auth)          |
| Email          | SMTP (Gmail/System sender)           |
| Observability  | LangSmith                            |

## Project Structure

```
OpsAssistant/
├── backend/
│   ├── routers/
│   ├── services/
│   ├── prompts/
│   ├── models/
│   └── ...
├── frontend/
│   ├── src/
│   └── ...
├── docs/
│   ├── prompt_spec.md
│   ├── tool_ab_test_results.md
│   └── red_team_findings.md
└── README.md
```

## Setup

1. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # fill in keys
   uvicorn main:app --reload
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Supabase:**
   - Run schema SQL to create tables and functions.
   - Enable pgvector.

4. **LangSmith (optional):**
   - Add `LANGSMITH_API_KEY` to `.env`.

## Usage

1. Register / login.
2. Upload documents (PDF/DOCX).
3. Ask questions – the agent uses RAG and tools.
4. Create clients/tasks from chat.
5. Draft emails and approve/reject in the Approval Queue.