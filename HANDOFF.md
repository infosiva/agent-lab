# HANDOFF — agent-lab (personal upskilling project)
**Date:** 2026-07-16  **Status:** DEPLOYED — https://agent-lab-nine.vercel.app (sivaprakasam) — real query UI live
**Goal:** RAG-backed multi-agent orchestrator (LangGraph + Qdrant Cloud + OTel), deployed on Vercel, used to query the `agents/` monorepo itself.

**Purpose:** Personal upskilling, not a portfolio ship. Hands-on with orchestration + vector DB layers of the "Full Stack of Agentic AI" (LinkedIn ref, Rushika Rai). Not subject to §0-DESIGN-PIPELINE / §Z6 UI rules — internal tool, functional UI only.

## HARD RULE — Vercel account
New project → **sivaprakasam** scope ONLY (infosiva frozen, no exceptions). `vswitch sivaprakasam && vlink` before any `vercel link`/`vercel --prod`. Verify `.vercel/project.json` orgId = `team_o4yd8mPfnYYzbpPwlbdxNnWE` before every deploy.

## HARD RULE for this project
Every lookup/exploration step in this project MUST go through graphify first (`graphify query/explain/path`), same as the rest of `agents/`. This project is ALSO the place we dogfood token-minimization tooling on itself:
- graphify indexes its own codebase as it grows — re-run `graphify update .` after each phase
- Use RTK (`rtk gain`) to track token savings on this project's own dev loop
- No grep/Read exploration without a graphify attempt first — this repo is the test case for whether that discipline holds inside a fresh project from day 1

## Stack
| Layer | Choice |
|---|---|
| Frontend | Next.js 15 App Router (scaffolded) |
| Ingestion | Node walker (`scripts/ingest.ts`) — raw read, ext-filtered, dir-skipped |
| Chunking | Own char-window splitter (`lib/chunk.ts`, 1200/150 overlap) — ponytail: upgrade to LangChain splitter if quality needs it |
| Embeddings | Ollama `nomic-embed-text` (ingestion, local, free) / Gemini `text-embedding-004` (query, cloud fallback) — both 768-dim |
| Vector DB | Qdrant Cloud (free tier) — live, verified |
| Retrieval | LangChain retriever → Qdrant |
| Orchestration | LangGraph (plan → retrieve → synthesize → critique loop) |
| LLM | reuse `ai-platform-template/lib/ai.ts` cascade (Groq→Gemini→Anthropic) |
| Observability | OpenTelemetry spans per graph node → Langfuse (free self-host/cloud tier, native OTel span ingestion) |
| Eval | promptfoo (free/OSS) — regression test planner/synthesizer prompts before locking into graph nodes |
| Deploy | Vercel (sivaprakasam scope — new project) |

## Files to touch
- `lib/ai.ts` — copy canonical cascade from `ai-platform-template/lib/ai.ts`
- `lib/qdrant.ts` — Qdrant client + upsert/query helpers
- `lib/ingest.ts` — repo walker + chunker + embedder script
- `lib/graph.ts` — LangGraph state graph definition
- `lib/otel.ts` — tracing setup
- `app/api/query/route.ts` — retrieval-only endpoint (phase 3 checkpoint)
- `app/api/agent/route.ts` — full orchestrator endpoint (phase 4)
- `app/page.tsx` — minimal query UI
- `.env.local` — QDRANT_URL, QDRANT_API_KEY, OPENAI_API_KEY (embeddings), existing AI cascade keys

## Steps
- [x] Scaffold Next.js project
- [x] Write HANDOFF.md
- [ ] Phase 1: wire Qdrant Cloud client + `.env.local`, copy `lib/ai.ts` cascade
- [x] Phase 2: ingestion script — walk repo, chunk, embed, upsert to Qdrant (smoke-tested on agent-lab's own 15 files → 44 chunks, verified live in Qdrant Cloud: 44 points, 768-dim cosine)
- [x] Phase 3: `/api/query` retrieval-only endpoint. Fixed 2 build errors inherited from ai-platform-template copy: dead `@/vertical.config` import (removed, agent-lab has no vertical config) + missing `@anthropic-ai/sdk` dep (installed). Live-tested: "what is the chunking strategy for ingestion?" → top hit `scripts/ingest.ts` (0.66 sim), 2nd `lib/chunk.ts` — correct semantic match.
- [x] Phase 4: LangGraph orchestrator (`lib/graph.ts`, `/api/agent`). plan → retrieve → synthesize → critique, loops back to retrieve on NO verdict, max 2 loops. Fixed state/node name collisions (LangGraph forbids a node sharing a name with a state channel — renamed state fields to `searchQuery`/`critiqueNote`). Synthesize+critique prompts hardened to forbid inventing facts not in retrieved context (caught a real hallucination in testing: model invented "RecursiveCharacterTextSplitter/LangChain" for a hand-rolled splitter). Live-tested: 2-loop run, correct chunk size/overlap answer, sources cited.
- [x] Phase 5a: OTel instrumentation per graph node (`lib/otel.ts`) → Langfuse sink, wired via `tracedChat()` wrapper around `aiChat()` calls in `lib/graph.ts`. Not yet live-verified against Langfuse dashboard (blocked — no Langfuse credentials provisioned, check `agents/.env.shared` or ask user before verifying traces actually land).
- [x] Phase 5b: promptfoo evals for plan/synthesize/critique prompts — `promptfoo/{plan,synthesize,critique}.provider.mjs` + matching `.yaml` configs, one config per prompt (NOT a combined config — see gotcha below). Providers call the exact same `aiChat()`/prompt path as production `lib/graph.ts`, so eval results reflect real behavior.
  - `plan.yaml`: 3/3 pass, stable.
  - `critique.yaml`: found and fixed a real prompt bug — critic was failing correct, fully-grounded answers for including extra correct detail beyond the literal question ("chunk size" answer also mentioning overlap → penalized). Fixed `lib/graph.ts` critique prompt to separate "grounded in context" (fail on this) from "answer scope" (don't fail on this) — see prompt diff below. Still shows run-to-run variance (2/3–3/3 across repeat runs) since the grading model has no pinned temperature; treated as expected LLM-judge variance, not chased to deterministic 100%.
  - `synthesize.yaml`: 0/3, 3 errors every run — **not a prompt or code bug**. Root cause: at eval time every provider in `lib/ai.ts`'s cascade was simultaneously unavailable (Ollama not running locally, Groq key present but quota-exhausted, all other keys unset, Anthropic key present but returning 401/invalid). This is an ops/credentials issue, not a defect in `synthesizeNode` — the provider file and prompt are structurally sound (same pattern as the two working evals). Needs: rotate/verify `GROQ_API_KEY` and `ANTHROPIC_API_KEY` in `.env.local`, or start local Ollama, then re-run `npx promptfoo eval -c promptfoo/synthesize.yaml --no-cache`.
  - Run any eval: `cd promptfoo && npx promptfoo eval -c <name>.yaml --no-cache`
  - **Gotcha (costly to rediscover):** promptfoo's per-test `options.providers` does NOT gate which providers execute — it only narrows which provider's output is used for that test's assertions in reporting. A single config with 3 providers × 9 tests actually runs all 27 combinations, with wrong vars reaching mismatched providers. Fix: one config file per provider, each with a single-entry top-level `providers:` list. Do not go back to a combined config.
  - Custom providers (`file://x.mjs`) MUST export a default **class** with `id()` + `async callApi(prompt, context)` — a plain exported function throws `TypeError: not a constructor` at load time.
  - `.env.local` (not `.env`) holds real keys here — providers need `config({ path: '../.env.local' })`, not bare `import 'dotenv/config'`.
  - Deliberately avoided `llm-rubric` assertions (they need their own grading-provider config, adds unrequested infra) — used deterministic `javascript`/`contains`/`not-contains`/`starts-with` assertions instead, except critique.yaml which necessarily grades a YES/NO model output via `starts-with`.
- Tooling decision: Langfuse (free, native OTel ingestion) for Phase 5 observability; promptfoo (free/OSS) for evaling planner/synthesizer/critique prompts — wired and exercised (see above), not yet part of a CI gate.
- [x] Phase 6: Vercel deploy — live at `https://agent-lab-nine.vercel.app`, sivaprakasam scope confirmed (`.vercel/project.json` orgId `team_o4yd8mPfnYYzbpPwlbdxNnWE`). Env vars pushed to production: QDRANT_URL, QDRANT_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY (CEREBRAS_API_KEY not set locally, skipped; OLLAMA_HOST deliberately excluded — local-only per §11). 200 OK smoke check passed. Cold-start behavior of the agent loop not yet exercised live — do that before calling Phase 6 fully verified.
- [x] Phase 7: dogfood ingestion — scoped to docs + shared tooling only (root `.md` files, `docs/`, `design-system/` md-only, `scripts/`, `ai-platform-template/`, `agent-lab/`), not full 10,591-file monorepo. Fixed 2 real bugs in `scripts/ingest.ts`/`lib/chunk.ts`: (1) `INGEST_ROOT` env var — script's `process.cwd()` resolves to `agent-lab/`, targets live one level up; (2) UTF-16 lone-surrogate bug in `chunkText()` — `.slice()` can split a surrogate pair at a chunk boundary, producing invalid JSON that 400'd on Qdrant upsert; added `stripLoneSurrogates()`. Final run: 1294 chunks from 128 files, upserted clean, zero errors. `ONLY_MD_DIRS` mechanism added to `ingest.ts` to handle `design-system/` (vendors a nested `.git`+`node_modules`, not native content). Not yet used for a live query test against the new corpus — do that before calling retrieval quality "iterated."
- [ ] graphify: `graphify update .` after each phase
- Standing pattern (added 2026-07-16): any future LangGraph loop in this project uses the goal-driven pattern already in `lib/graph.ts` — a `satisfied` boolean drives routing via `addConditionalEdges`, a fixed `MAX_LOOPS` is a safety ceiling only, never the primary control. No code change needed, already implemented — just declaring it standard going forward.

## Full Stack of Agentic AI — agent-lab mapping (per Rushika Rai layer/role diagrams)

### Layer-based stack
| Layer | Tool(s) in agent-lab | Status |
|---|---|---|
| Frontend | Next.js 15 App Router (`app/page.tsx`) | Live |
| Document ingestion | `scripts/ingest.ts` — repo walker, ext-filtered, `INGEST_ROOT`-scoped | Live |
| Chunking | `lib/chunk.ts` — own char-window splitter, 1200/150 overlap, UTF-16 surrogate-safe | Live |
| Embeddings | Ollama `nomic-embed-text` (ingest, local/free) + Gemini `text-embedding-004` (query, cloud fallback), 768-dim both | Live |
| Vector database | Qdrant Cloud (free tier) | Live, 1294 chunks/128 files indexed |
| Retrieval layer | LangChain retriever → Qdrant, exposed via `/api/query` | Live |
| Prompt engineering | plan/synthesize/critique prompts in `lib/graph.ts` + promptfoo evals (`promptfoo/*.yaml`) as regression gate | Live (2/3 evals green, 1 blocked on live provider quota) |
| LLM (model/API gateway) | `lib/ai.ts` cascade — Ollama→Groq→Gemini→Cerebras→...→Anthropic, task-aware `quality: fast/balanced/best` tiers picking cheapest working model per node | Live |
| Infra / deployment | Vercel (sivaprakasam scope) | Not yet deployed — Phase 6 pending |
| Observability & evaluation | OpenTelemetry spans (`lib/otel.ts`) → Langfuse; promptfoo for prompt regression | Wired, Langfuse trace delivery not yet live-verified (needs credentials) |

### Role-based stack
| Role | What agent-lab exercises |
|---|---|
| LLM Engineer | Prompt design + evals for plan/synthesize/critique nodes (promptfoo), task-aware model-tier selection in `lib/ai.ts` |
| RAG Engineer | Chunking strategy, embedding choice, Qdrant schema/upsert, retrieval quality tuning (`lib/chunk.ts`, `lib/qdrant.ts`, `/api/query`) |
| Agentic AI Engineer | LangGraph state machine — plan→retrieve→synthesize→critique loop with conditional routing (`lib/graph.ts`) |
| AI Agents Engineer | Loop control pattern — `satisfied` boolean drives `addConditionalEdges`, `MAX_LOOPS` as safety ceiling not primary control |
| AI Engineer | End-to-end wiring — API routes, env/config, provider fallback cascade, error handling across the whole stack |
| ML Engineer | Embedding model selection/comparison (Ollama vs Gemini), vector similarity tuning — smallest-footprint role here since this project reuses pretrained embedding models rather than training/fine-tuning |

## Phase 6c: live cold-start test — FAILED, root cause = dead keys (2026-07-16)
`/api/agent` on live URL returns 500 "All AI providers exhausted." Pulled Vercel runtime logs (`vercel logs <url>`): Groq 401, Anthropic 401, Gemini 429 (quota), rest skipped (no key/local-only, expected). Tested local `.env.local` GROQ_API_KEY and ANTHROPIC_API_KEY directly against provider APIs (`curl .../v1/models`) — both return 401 independent of Vercel, so this isn't a bad push, the keys themselves are dead. Same class of issue as portfolio tasks #9/#10/#11 (tutiq, resumevault, quizbites cascade exhaustion) — a portfolio-wide Groq/Anthropic credential rotation is needed, out of scope to fix by pushing new keys without the user naming/supplying them. Blocked on: user rotates GROQ_API_KEY + ANTHROPIC_API_KEY (and clears Gemini quota or waits for reset), then re-push + redeploy.

## Phase 6b: real UI (2026-07-16)
Deploy shipped default Next.js scaffold at `/` — `app/page.tsx` was never actually built out despite being on the original file-touch list. Caught via live screenshot. Fixed: replaced scaffold with a minimal query UI (input → POST `/api/agent` → renders answer, source chips, loop count, critique verdict). Rebuilt, redeployed to same sivaprakasam project. Verified live: `curl https://agent-lab-nine.vercel.app` now returns real page content ("agent-lab", "RAG orchestrator", "Ask about the agents…"), not scaffold markers.

## Success criteria
- Ingestion populates Qdrant with real chunks from `agents/` repo
- `/api/query` returns relevant chunks for a real question
- LangGraph orchestrator completes a plan→retrieve→answer→critique loop end to end, traced
- Deployed on Vercel (sivaprakasam), reachable, answers a real question about the `agents/` codebase correctly

## Resume from here if interrupted
Phase 3 verified (retrieval endpoint live-tested, correct semantic matches). Next: Phase 4 — LangGraph orchestrator (planner → retriever tool-call → synthesizer → critique loop) wrapping `/api/query` + `aiChat()`. Full `agents/` monorepo ingestion (5,748 files) still deferred — do it once the orchestrator loop is proven end-to-end on the small set, so we don't re-ingest twice if chunking/embedding params change.

`.env.local` written (Qdrant creds + reused GROQ/GEMINI/CEREBRAS/ANTHROPIC keys from `agents/.env.shared`) — gitignored, not synced to shared env (Qdrant key is agent-lab-scoped only, not portfolio-wide).
