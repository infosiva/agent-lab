"use client";

import { useState } from "react";

type AgentResult = {
  answer: string;
  sources: string[];
  loops: number;
  critique: string;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            agent-lab
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            RAG orchestrator over the <code>agents/</code> monorepo — LangGraph plan → retrieve → synthesize → critique loop, Qdrant vector search.
          </p>
        </div>

        <form onSubmit={ask} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the agents/ codebase…"
            className="flex-1 rounded-lg border border-black/[.08] bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black/30 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/40"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-40 dark:hover:bg-[#ccc]"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>

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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
