---
name: pkm-retrieval
description: Proactively search the user's personal knowledge base (PKM) before answering. The user has explicitly requested that every query be screened for PKM relevance — if the query might touch notes, schedules, documents, hobbies, preferences, or any user-specific content, call this skill first.
metadata: {"clawdbot":{"emoji":"🧠"}}
---

# pkm-retrieval

## Owner Preference (Do Not Ignore)

**The user explicitly wants PKM to be checked proactively on every query.**

Before answering any user message, decide whether it could benefit from their personal knowledge (notes, schedules, documents, past conversations, project files, hobbies, preferences). If yes or uncertain, execute PKM retrieval and incorporate results.

Do **not** wait for the user to explicitly ask "search my PKM".

## Configuration

PKM credentials are stored in:
- **`skills/pkm-retrieval/config.json`** — machine-readable config (`base_url`, `auth_token`)

Load the config file when making API calls. Never hardcode secrets in this skill file.

## Auto-dispatch Rule (Mandatory)

**Every user message must be screened for PKM relevance before answering.**

1. On receiving any user query, first decide whether it could benefit from personal knowledge (notes, schedules, documents, past conversations, project files, or any user-specific content).
2. If **yes** or **uncertain**, execute a PKM retrieval using the query (or a distilled retrieval query).
3. Summarize any results found and incorporate them into the answer.
4. If **nothing relevant is found**, answer from general knowledge and optionally note that the PKM had no match.
5. Do **not** wait for the user to explicitly ask "search my PKM" — proactively check every time.

### When PKM is likely relevant
- Any question about personal schedules, tasks, notes, or documents.
- References to past conversations, projects, or decisions recorded in notes.
- Requests that might touch uploaded files (e.g., papers, daily logs, specifications).
- Factual questions where the user previously stored related material.
- Questions about hobbies, interests, preferences, routines.
- Any query that seems like "do I have something about X in my notes?"

### When PKM is NOT relevant
- Pure general-knowledge questions (e.g., "What is the capital of France?").
- Simple arithmetic or logic puzzles with no personal context.
- Greetings or social chat with no informational need.
- Broad open-ended requests without any personal reference.

## API behavior

- Endpoint: `POST <base_url>` — read `base_url` from `config.json`
- Authentication: Bearer token from `config.json`
- Content-Type: `application/json`

### Executing a Retrieval Query

When the user asks a question and the auto-dispatch rule says "yes":
1. Read `skills/pkm-retrieval/config.json` to get `base_url` and `auth_token`.
2. Call `<base_url>` with the user's query.
3. Return a concise, summarized answer.
4. Include source document names when helpful.

### Request body template

```json
{
  "query": "<user query>"
}
```

### cURL example

```bash
curl -s -X POST \
  '<base_url>' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <auth_token>' \
  -H 'Content-Type: application/json' \
  -d '{"query": "your search query"}'
```

## How to interpret results

The API returns a **JSON array of records**. Each record is one chunk:

```json
[
  {
    "segment": {
      "content": "raw text of the chunk",
      "document": { "name": "source-filename.md" },
      "score": 0.5141
    }
  }
]
```

Key fields to extract:
- **`segment.content`** — the actual text content of the chunk (use this)
- **`segment.document.name`** — source file name (cite when helpful)
- **`segment.score`** — relevance score, higher is better

Guidelines:
- Extract `segment.content` from each record; ignore `sign_content` and other metadata unless needed for context.
- Prefer the highest-score chunks first.
- If one chunk is a clear exact match and the rest are noisy, answer from the best chunk and ignore the noisy tail.
- Summarize relevant content concisely; do not dump raw JSON.
- Mention source document names when helpful.

## Response style
- Return a concise answer first.
- If needed, add a short source line with the document name.
- If nothing relevant is found, say so clearly and fall back to general knowledge.
