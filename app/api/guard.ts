// In-memory rate limiting. Resets when the serverless function cycles,
// which is fine: the goal is blunting abuse, not perfect accounting.

const hits = new Map<string, number[]>();

export function rateLimit(req: Request, max = 8, windowMs = 60 * 60 * 1000) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);

  if (recent.length >= max) return false;

  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) hits.clear(); // crude memory ceiling
  return true;
}

/** Strips the obvious injection attempts out of free-text input. */
export function clean(input: unknown, maxLen = 100): string {
  return String(input ?? "")
    .slice(0, maxLen)
    .replace(/[\r\n]+/g, " ")
    .replace(/ignore .{0,20}(previous|prior|above|earlier) .{0,20}instructions?/gi, "")
    .replace(/\b(system|assistant|user)\s*:/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .trim();
}