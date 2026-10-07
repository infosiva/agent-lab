# DESIGN.md - agent-lab

Source of truth: `agents/design-system` (MASTER.md, `ds-source` skill). Reuse from there before building; new reusable pieces go there first.

## Identity
- Product: agent-lab (RAG agent over a codebase)
- Accent: `#3b82f6` (kept from the existing design; palette checked with `design-system/scripts/check-palettes.mjs`)
- Base background: `#0b1424`
- Logo: `components/Logo.tsx` (glyph + wordmark, key word in `var(--accent)`), used in the header; favicon is `app/icon.svg` (no `icon.tsx`).
- Background: `components/AnimatedBg.tsx` mounted in `app/layout.tsx`; style from the hub (`layout.bgAnimation`, `bgSpeed`).

## Hub override
Hub (Edge Config `theme_agent-lab.design`) customises dials, brief, palette, GA4 and flags with no code change; hub values win over this file. Theme is loaded via `lib/theme-loader.ts` in `app/layout.tsx`.

## AI platform (ai-core)
Exemption: agent-lab is itself a standalone RAG reference lab (own qdrant + embeddings + eval in promptfoo). It is not a tenant app; migrate to ai-core (`agents/ai-core`) only if it becomes a product.
