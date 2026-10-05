"use client";

import { useState } from "react";
import { MagneticButton } from "@infosiva/shared-ui/modern";

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
      if (!res.ok) throw new Error(data.error || "Agent run failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] text-sm font-bold text-[var(--accent)] dark:bg-white/10">
            a_
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
              agent<span className="text-[var(--accent)]">-lab</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              RAG orchestrator — plan → retrieve → synthesize → critique
            </p>
          </div>
        </div>

        <form onSubmit={(e) => ask(e)} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the ingested codebase…"
            className="flex-1 rounded-lg border border-black/[.08] bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-[var(--accent)] dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
          />
          <MagneticButton
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
                className="rounded-full border border-black/[.08] px-3 py-1.5 text-xs text-zinc-600 hover:border-[var(--accent)] hover:text-[var(--accent)] dark:border-white/[.145] dark:text-zinc-400"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-black/[.08] bg-white px-4 py-3 text-sm text-zinc-600 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            retrieving context, synthesizing, self-critiquing — up to 2 retrieval loops
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Answer</div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-black dark:text-zinc-50">
                {result.answer}
              </p>
            </div>

            {result.sources?.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sources</div>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.sources.map((s) => (
                    <li
                      key={s}
                      className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-zinc-500">
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
