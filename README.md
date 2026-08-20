# OpsAssistant

OpsAssistant is an operations agent that answers company questions from a knowledge base, looks up structured data (clients, tasks), performs scientific calculations, and drafts emails — with memory, guardrails, and a human approval step before sending.

## ✨ Features

- 🔐 **Authentication**: Supabase email/password auth with JWT
- 📄 **Document Upload & RAG**: PDF/DOCX upload, chunking, local embeddings, pgvector similarity search
- 👥 **Structured Data**: Look up and add clients/tasks via Supabase
- 🧮 **Scientific Calculator**: Supports arithmetic, trigonometric, logarithmic, and other math functions
- ✉️ **Email Drafting & Approval**: Real SMTP sending with human-in-the-loop approval
- 🧠 **Memory**: Conversation memory across turns (LangGraph)
- 🛡️ **Guardrails**: Prompt injection detection, refusal rules, tool-error recovery, max-step limits
- 📊 **Observability**: LangSmith tracing for monitoring and debugging

## 🧰 Tech Stack

| Layer         | Technology                        |
|---------------|------------------------------------|
| Frontend      | React, Vite, Lucide icons          |
| Backend       | FastAPI, LangChain, LangGraph      |
| LLM           | Groq (`openai/gpt-oss-120b`)       |
| Embeddings    | `all-MiniLM-L6-v2` (384-dim)       |
| Vector DB     | Supabase pgvector                  |
| Database      | Supabase (PostgreSQL, Auth)        |
| Email         | SMTP (system sender)               |
| Observability | LangSmith                          |

## 📁 Project Structure

```
OpsAssistant/
├── backend/
│   ├── .gitignore
│   ├── requirements.txt
│   ├── config.py
│   ├── main.py
│   ├── dependencies.py
│   ├── models/
│   │   └── schemas.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── documents.py
│   │   └── emails.py
│   ├── services/
│   │   ├── agent.py
│   │   ├── db_service.py
│   │   ├── email_service.py
│   │   ├── embedding_service.py
│   │   ├── llm_service.py
│   │   ├── document_processor.py
│   │   └── tools.py
│   ├── prompts/
│   │   └── agent_prompt.py
│   └── __pycache__/ (ignored)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── AuthView.jsx
│   │   │   ├── ChatView.jsx
│   │   │   ├── DocumentPanel.jsx
│   │   │   ├── ApprovalQueue.jsx
│   │   │   └── Navbar.jsx
│   │   └── services/
│   │       └── api.js
│   └── node_modules/ (ignored)
├── docs/
│   ├── prompt_spec.md
│   ├── tool_ab_test_results.md
│   └── red_team_findings.md
├── README.md
└── .gitignore
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase account
- Groq API key
- Gmail account (for SMTP sending)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with your actual keys:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TITLE_MODEL=openai/gpt-oss-120b
SUPABASE_URL=https://...
SUPABASE_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM_NAME=OpsAssistant
EMAIL_FROM_ADDRESS=your_email@gmail.com
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=OpsAssistant
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

Run the backend:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Supabase Setup

Run the SQL schema (provided in `supabase_schema.sql`) to create:

- `chat_sessions`, `messages`
- `documents`, `chunks`
- `clients`, `tasks`
- `email_logs`
- `match_chunks` function
- HNSW index on embeddings

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## 🧪 Usage

1. Register / login.
2. Upload documents via the Documents button.
3. Ask questions — the agent uses `rag_search` and displays sources at the end.
4. Use tools:
   - `lookup_client`, `lookup_task`
   - `add_client`, `add_task`
   - `calculator`
   - `draft_email`, `update_draft`
5. Open the Approval Queue to review drafts and approve/reject.
   - Approved emails are sent via SMTP with `Reply-To` set to the logged-in user's email.

## 📚 Documentation

- [Prompt Specification](docs/prompt_spec.md)
- [Tool A/B Test Results](docs/tool_ab_test_results.md)
- [Red Team Findings](docs/red_team_findings.md)

## 🛡️ Security

- JWT authentication on all protected endpoints
- Prompt injection detection at the API layer
- Safe AST evaluation for calculator (no arbitrary code execution)
- Max tool call limit enforced to prevent infinite loops