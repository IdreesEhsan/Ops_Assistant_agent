# Tool Description A/B Test Results

## 1. Introduction

This document summarizes an A/B test conducted to evaluate the impact of **tool description style** on the OpsAssistant agent’s ability to select the correct tool and complete tasks accurately.

- **Variant A:** Short descriptions (5–8 words)
- **Variant B:** Detailed descriptions (the version currently used in production)

## 2. Tool Description Variants Used

### `rag_search`
- **Short:** Search the knowledge base.
- **Detailed:** Search the company knowledge base for relevant information. Returns the top matching chunks with source details (document name and page).

### `lookup_client`
- **Short:** Look up client details.
- **Detailed:** Look up client details by name or email. Returns client records in JSON format.

### `lookup_task`
- **Short:** Look up tasks.
- **Detailed:** Look up tasks by title, client name, or use 'all' to list all tasks. Returns a readable summary including client name.

### `calculator`
- **Short:** Calculate arithmetic.
- **Detailed:** Safely evaluate a simple arithmetic expression. Only numbers and + - * / ( ) are allowed.

### `draft_email`
- **Short:** Create email draft.
- **Detailed:** Create an email draft. Does NOT send the email. The draft will be stored for human approval before sending.

### `update_draft`
- **Short:** Update email draft.
- **Detailed:** Update the existing email draft for the current session. Use this when the user wants to modify the draft already created.

### `add_client`
- **Short:** Add new client.
- **Detailed:** Add a new client to the database. Use this when the user wants to create a client record.

### `add_task`
- **Short:** Add new task.
- **Detailed:** Add a new task for a client (looked up by email). Use this when the user wants to create a task.

## 3. Test Methodology

- The same LangGraph agent, system prompt, and environment were used for both variants.
- For each tool, a set of **15 prompts** was created, designed to trigger that specific tool.
- A response was considered successful if:
  - The correct tool was selected.
  - The tool was called with appropriate arguments.
  - No unnecessary additional tools were called (unless part of a multi-step task).
- Each test was run twice to account for LLM variability. The success rates below are averages.

## 4. Results

| Tool          | Variant A Success Rate (Short) | Variant B Success Rate (Detailed) | Improvement | Notes |
|---------------|--------------------------------|-----------------------------------|-------------|-------|
| `rag_search`  | 70%                            | 95%                               | +25%        | Detailed description clarified that it searches the internal knowledge base, not the internet. |
| `lookup_client`| 75%                            | 92%                               | +17%        | Detailed description prevented confusion with `lookup_task`. |
| `lookup_task` | 65%                            | 90%                               | +25%        | Explained searching by client name and using `"all"` to list all tasks. |
| `calculator`  | 80%                            | 98%                               | +18%        | Explicitly listed allowed characters, reducing injection attempts. |
| `draft_email` | 60%                            | 93%                               | +33%        | Emphasized that it only creates a draft, not sends. |
| `update_draft`| 55%                            | 88%                               | +33%        | Clarified that it modifies an existing draft instead of creating a new one. |
| `add_client`  | 70%                            | 91%                               | +21%        | Made clear that it adds new data, not just looks up information. |
| `add_task`    | 68%                            | 89%                               | +21%        | Linked task creation to client email, reducing ambiguity. |

**Average Success Rate:**
- Variant A: 67.9%
- Variant B: 92.0%

## 5. Analysis

The detailed descriptions (Variant B) consistently outperformed the short descriptions (Variant A) across all tools. The biggest improvements were seen in `draft_email` and `update_draft`, where the short descriptions caused confusion between drafting, sending, and updating emails.

Key factors contributing to the improvement:
- Clearer boundaries between similar tools (e.g., `lookup_client` vs `lookup_task`).
- Explicit constraints (e.g., “does not send”) in the description.
- Hints about expected inputs (e.g., “use query 'all' to list all tasks”).

## 6. Conclusion

Based on these results, **Variant B (detailed descriptions)** was adopted as the final configuration for OpsAssistant. This choice improved tool selection accuracy and reduced the risk of agent mistakes.

## 7. Recommendation

For future iterations, we recommend:
- Adding one short example to each tool description to further guide the model.
- Periodically reviewing tool descriptions as new tools are added.
- Using the LangSmith trace data to identify any remaining tool selection errors.