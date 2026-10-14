import "server-only";

const hits = new Map<string, number[]>();

/**
 * Basic sliding-window limiter: at most `limit` calls per `windowMs` per key.
 *
 * The counters live in this serverless instance's memory, so they reset on a
 * cold start and aren't shared between instances. That's enough to stop a
 * script hammering one form, not a determined attacker. A shared store (e.g.
 * Upstash Redis) would be the upgrade if this ever matters.
 */
export function isRateLimited(key: string, limit = 5, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}
