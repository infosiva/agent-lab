// Structured JSON-line logger (Vercel log drains parse these). Never pass PII, secrets or prompt text.
type Level = "info" | "warn" | "error";
export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...fields });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}
