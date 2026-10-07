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


## ANIMATED SCOPE (gate items 19/21, derived from code 2026-10-07)
- Moves: AnimatedBg (ambient hero/background); CSS keyframes: ds-float, ds-in, ds-shift; transitions on interactive elements.
- Trigger: page load (ambient) and hover/press (interactive). Reduced motion: honoured via prefers-reduced-motion block.
- Added 2026-10-07 (item 21): mesh wash (body::before, accent radial gradients) under AnimatedBg; `.cta-grad` gradient CTA (hover glow, press scale .97 via 150ms ease-out); `.stagger` entry (children fade/rise 70ms apart, on page load only); `.chip` 44px suggestion targets with press scale. Why: hierarchy on load, tactile feedback on the one core action.
- Reduced motion: one `@media (prefers-reduced-motion: reduce)` block in app/globals.css disables stagger, CTA/chip transitions and press transforms.
- Verified: Playwright 375x812 and 1280x800 after last edit, no horizontal overflow (scrollWidth == clientWidth), no input/button under 43px, Ask box and CTA above the fold.
- Caveats: not run in this pass: emil-design-eng, fixing-accessibility, review-animations as separate skill invocations; contrast checked by eye and token design (on-accent is auto-computed), not by a measuring tool. Mobile consent banner overlaps the Feedback button (pre-existing).
- TODO: run `/fixing-accessibility` and measured contrast check; fix consent banner/feedback overlap at 375px.
TODO: Skill tool was not invoked for taste-skill or animate in this pass, and impeccable context/search.py scripts were not run; item 21 stays open until they are.
