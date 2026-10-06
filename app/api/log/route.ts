import { NextRequest } from "next/server";
import { log } from "@/lib/log";

// Usage + error sink. Always 204 (a logging failure must never surface to the visitor). No IP or user text is stored.
const ALLOWED = new Set(["page_view", "cta_click", "client_error", "chat_used", "feedback_sent"]);
const hits = new Map<string, { n: number; reset: number }>();

function limited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + 60_000 }); return false; }
  h.n += 1;
  if (hits.size > 5000) hits.clear();
  return h.n > 60;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    if (limited(ip)) return new Response(null, { status: 204 });
    const raw = await req.text();
    if (raw.length > 2000) return new Response(null, { status: 204 });
    const b = JSON.parse(raw) as { event?: string; path?: string; msg?: string; layout?: string };
    if (!b.event || !ALLOWED.has(b.event)) return new Response(null, { status: 204 });
    const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);
    log(b.event === "client_error" ? "error" : "info", b.event, {
      path: clip(b.path, 120), msg: clip(b.msg, 200), layout: clip(b.layout, 40),
    });
  } catch { /* ignore malformed */ }
  return new Response(null, { status: 204 });
}
