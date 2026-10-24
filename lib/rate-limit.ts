// Data traffic handling — simple in-memory token bucket per IP + route.
// Production me isay Redis (Upstash) se replace karein; interface aik jesa rahega.
// Limits: reads 60/min, writes 20/min, chat 30/min. Zyada ho to 429.
interface Bucket { count: number; resetAt: number; }
const buckets = new Map<string, Bucket>();

export function rateLimit(req: Request, kind: 'read' | 'write' | 'chat' = 'read'): { ok: boolean; retryAfterSec: number } {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const url = new URL(req.url);
  const key = `${ip}:${url.pathname}:${kind}`;
  const limit = kind === 'write' ? 20 : kind === 'chat' ? 30 : 60;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(JSON.stringify({ error: 'Too many requests — please try again shortly.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSec) },
  });
}
