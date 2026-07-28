// In-memory sliding-window rate limit — fine for single-instance Vercel deploy,
// resets on cold start. No external store needed at this scale.
const hits = new Map<string, number[]>();

export function checkRateLimit(ip: string, maxPerHour = 20): { ok: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const timestamps = (hits.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxPerHour) {
    hits.set(ip, timestamps);
    return { ok: false, remaining: 0 };
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return { ok: true, remaining: maxPerHour - timestamps.length };
}

export function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}
