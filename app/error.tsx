"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      fetch("/api/log", { method: "POST", keepalive: true, body: JSON.stringify({ event: "client_error", path: location.pathname, msg: `${error.message} ${error.digest ?? ""}`.slice(0, 200) }) }).catch(() => {});
    } catch { /* ignore */ }
  }, [error]);
  return (
    <main className="ds-wrap" style={{ padding: "4rem 1.25rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Something went wrong</h1>
      <p style={{ opacity: 0.75, margin: "0.75rem 0 1.5rem" }}>It has been logged. Try again.</p>
      <button type="button" className="ds-btn" onClick={reset}>Try again</button>
    </main>
  );
}
