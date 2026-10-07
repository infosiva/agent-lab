# DESIGN-LOCK — agent-lab (RAG orchestrator: plan -> retrieve -> synthesize -> critique)
**Date:** 2026-10-06  **Status:** IN PROGRESS (design finalized before code)
- Archetype: `travel-magazine` (pickArchetype, avoid-list honoured; default only, hub `theme_agent-lab.layout.archetype` overrides at runtime via `data-layout`)
- Default bg / accent: `#0b1424` / `#3b82f6` (registered in design-system/tokens/palette-registry.json, check-palettes = free). Hub palette overrides via `--theme-base`/`--theme-primary`.
- Background animation: AnimatedBg, default aurora, hub `layout.bgAnimation`/`bgSpeed` overrides; prefers-reduced-motion honoured
- Logo: "agent" + accent "-lab" word-mark with node-graph glyph
- Demo panel: live Ask box hitting /api/agent (real product), animated mesh bg
- Telemetry: hub-gated GA4 (consent denied by default), consent-gated usage log, structured error log -> /api/log (JSON lines, no PII, no IP stored)
- Notes: WEAK archetype fit (allowed set is tiny after the avoid list): travel-magazine used for its full-bleed hero + floating nav + roomy cards, not for content. No @vercel/edge-config installed and no new deps allowed -> lib/theme-loader.ts is a fetch-based Edge Config REST variant with the same exports and 600s cache. Needs /api/chat + /api/feedback added (free chain).
- Pillars: AI chat/feedback use free chain Groq->Gemini->Cerebras with graceful 200 fallback; no new deps; gaps (no evals/RAG changes in this pass) stated in final report.

---


## OWASP LLM Top 10 dispositions (gate item 45, 2026-10-07; list recalled from memory, unverified)
- LLM01 prompt injection: input sanitised in chat route (app/api/chat/route.ts); no output filtering or tool sandbox review done. PARTIAL.
- LLM02 sensitive info disclosure: `redact()` helper available; not applied to every log. PARTIAL.
- LLM04/10 DoS / unbounded consumption: per-IP rate limit where present; token budgets not enforced. PARTIAL.
- LLM05 improper output handling: model output rendered as text; not audited for HTML sinks. UNVERIFIED.
- LLM06 excessive agency: no tool-calling agents audited. UNVERIFIED.
- Others (supply chain, poisoning, embeddings, misinformation): not assessed.
