"use client";
// Consent-gated usage logging + always-on (PII-free) client error logging. GA4 itself is hub-gated in layout.tsx and
// starts with analytics_storage denied; "Allow" flips it via gtag consent update.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "ds-consent";
function send(body: Record<string, string>) {
  try {
    const data = JSON.stringify(body);
    if (!navigator.sendBeacon?.("/api/log", new Blob([data], { type: "application/json" }))) {
      fetch("/api/log", { method: "POST", body: data, keepalive: true }).catch(() => {});
    }
  } catch { /* ignore */ }
}
function stored(): string | null { try { return localStorage.getItem(KEY); } catch { return null; } }

export default function Telemetry() {
  const path = usePathname();
  const [ask, setAsk] = useState(false);
  useEffect(() => {
    const s = stored();
    setAsk(s === null);
    if (s === "granted") (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("consent", "update", { analytics_storage: "granted" });
    const onErr = (e: ErrorEvent) => send({ event: "client_error", path: location.pathname, msg: String(e.message || "error") });
    const onRej = (e: PromiseRejectionEvent) => send({ event: "client_error", path: location.pathname, msg: String(e.reason?.message || e.reason || "rejection") });
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => { window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onRej); };
  }, []);
  useEffect(() => {
    if (stored() === "granted") send({ event: "page_view", path, layout: document.documentElement.dataset.layout || "" });
  }, [path]);
  const choose = (v: "granted" | "denied") => {
    try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
    if (v === "granted") (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("consent", "update", { analytics_storage: "granted" });
    setAsk(false);
  };
  if (!ask) return null;
  return (
    <div role="dialog" aria-label="Privacy" className="ds-consent">
      <p>Anonymous usage stats help us fix things. No ads, no personal data.</p>
      <div>
        <button type="button" onClick={() => choose("denied")}>No thanks</button>
        <button type="button" className="ds-consent-yes" onClick={() => choose("granted")}>Allow</button>
      </div>
    </div>
  );
}
