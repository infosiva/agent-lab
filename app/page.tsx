"use client";

import { useState } from "react";
import { MagneticButton } from "@infosiva/shared-ui/modern";
import Logo from "@/components/Logo";

type AgentResult = {
  answer: string;
  sources: string[];
  loops: number;
  critique: string;
  remaining?: number;
};

const EXAMPLES = [
  "How does the retry loop in the LangGraph agent work?",
  "What embedding model does ingestion use?",
  "Where is rate limiting enforced?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);

  async function ask(e: React.FormEvent, q?: string) {
    e.preventDefault();
    const query = q ?? question;
    if (!query.trim() || loading) return;
    setQuestion(query);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Agent run failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen font-sans">
      <main className="stagger mx-auto w-full flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-14">
        <Logo size={36} />
        <h1 className="text-3xl font-semibold tracking-tight text-(--ink) sm:text-4xl">
          Ask your codebase. Get <span className="text-(--accent-ink)">sourced</span> answers.
        </h1>
        <p className="text-sm text-(--ink-2)">RAG orchestrator: plan, retrieve, synthesize, critique.</p>

        <form onSubmit={(e) => ask(e)} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the ingested codebase…"
            className="min-h-11 flex-1 rounded-lg border border-(--line) bg-(--surface) px-4 py-2.5 text-sm text-(--ink) outline-none focus:border-(--accent)"
          />
          <MagneticButton
            type="submit"
            disabled={loading || !question.trim()}
            className="btn-press cta-grad min-h-11 rounded-lg px-5 py-2.5 text-sm font-semibold text-(--on-accent) disabled:opacity-40"
          >
            {loading ? "Thinking…" : "Ask"}
          </MagneticButton>
        </form>

        {!result && !loading && !error && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={(e) => ask(e, ex)}
                className="chip rounded-full border border-(--line) px-3 py-2 text-xs text-(--ink-2) hover:border-(--accent) hover:text-(--accent-ink)"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-(--line) bg-(--surface) px-4 py-3 text-sm text-(--ink-2)">
            <span className="h-2 w-2 animate-pulse rounded-full bg-(--accent)" />
            retrieving context, synthesizing, self-critiquing — up to 2 retrieval loops
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-(--line) bg-(--surface) px-4 py-3 text-sm text-(--ink)">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4 rounded-lg border border-(--line) bg-(--surface) p-5 backdrop-blur">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-(--ink-2)">Answer</div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-(--ink)">
                {result.answer}
              </p>
            </div>

            {result.sources?.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-(--ink-2)">Sources</div>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.sources.map((s) => (
                    <li
                      key={s}
                      className="rounded-md bg-(--surface-strong) px-2 py-1 text-xs text-(--ink)"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-(--ink-2)">
              <span>{result.loops} retrieval loop{result.loops === 1 ? "" : "s"}</span>
              <span>·</span>
              <span title={result.critique}>
                critique: {result.critique?.trim().toUpperCase().startsWith("YES") ? "passed" : "review"}
              </span>
              {typeof result.remaining === "number" && (
                <>
                  <span>·</span>
                  <span>{result.remaining} requests left this hour</span>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
