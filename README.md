# agent-lab

RAG orchestrator you can point at **any codebase**. Ingests a repo into Qdrant,
then answers questions about it through a LangGraph self-critique loop
(`plan → retrieve → synthesize → critique`, re-retrieves up to 2x if the
critique step finds the answer isn't grounded in the retrieved context).

Built as a hands-on learning project for the full agentic-AI stack: vector
search, embeddings, graph orchestration, multi-provider LLM routing, and
tracing — end to end, from local dev to a deployed environment.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Orchestration | LangGraph — `plan → retrieve → synthesize → critique` state graph |
| Vector DB | Qdrant Cloud (free tier) |
| Embeddings | NVIDIA NIM `nv-embedqa-e5-v5` (1024-dim) — same model for ingest + query |
| LLM | Multi-provider cascade (`lib/ai.ts`) — Groq → Gemini → Cerebras → Anthropic, picked per quality tier (fast/balanced/best) per graph node |
| Tracing | OpenTelemetry + Langfuse — every node is a traced span |
| Eval | promptfoo (dev-only) |

## Setup

1. `npm install`
2. Copy `.env.local.example` → `.env.local`, fill in:
   - `QDRANT_URL` / `QDRANT_API_KEY` — free cluster at [cloud.qdrant.io](https://cloud.qdrant.io)
   - `NVIDIA_API_KEY` — free key at [build.nvidia.com](https://build.nvidia.com)
   - `GROQ_API_KEY` — free key at [console.groq.com](https://console.groq.com) (minimum for the LLM cascade to work)
3. Ingest a codebase (defaults to current dir if no path given):
   ```bash
   npx tsx scripts/ingest.ts /path/to/any/repo
   ```
4. Run it:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`, ask a question about the repo you ingested.

## How it works

- `scripts/ingest.ts` — walks the target repo (skips `node_modules`/`.git`/build
  dirs), chunks text files (`lib/chunk.ts`), embeds each chunk, upserts to Qdrant.
- `app/api/agent/route.ts` — the main endpoint. Runs the full LangGraph loop
  (`lib/graph.ts`): plans a search query, retrieves matching chunks, synthesizes
  an answer grounded only in retrieved context, then critiques itself — if the
  critique fails (answer not supported by context), it loops back to retrieve
  again, up to 2 times.
- `app/api/query/route.ts` — a lower-level endpoint that just does embed +
  vector search, no LLM synthesis. Useful for debugging retrieval quality on
  its own.

## Use it on your own repo

This isn't hardcoded to any one project — `scripts/ingest.ts` takes any path.
Point it at a different repo, wipe/reuse the Qdrant collection, and the same
UI + API work unchanged.

## Deploy

Vercel, zero config beyond the env vars above. `output: 'nodejs'` runtime on
both API routes (not edge) since the LangGraph/OTel deps need Node APIs.
