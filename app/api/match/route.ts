import { NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { matchRides, trustScore } from '@/lib/matching';
import { routeMatchScore } from '@/lib/ml/classifier';
import { getOriginalRidesBase } from '@/lib/original-rides';
import { fetchExternalRides } from '@/lib/external-sources';

// POST /api/match { from, to, time?, maxPrice?, womenOnly?, minRating? }
// AI Smart Matching — ORIGINAL rides only (Supabase verified + Sawarri board
// + partner APIs). No demo fallback: no original match = empty list + note.
export async function POST(req: Request) {
  const rl = rateLimit(req, 'read');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  if (!body.from || !body.to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }
  const base = await getOriginalRidesBase();
  const ext = await fetchExternalRides(body.from, body.to);
  const seen = new Set(base.map((b) => `${b.ride.driver_name}|${b.ride.from_area}|${b.ride.to_area}|${b.ride.ride_time}`));
  const pool = [...base];
  for (const r of ext) {
    const key = `${r.driver_name}|${r.from_area}|${r.to_area}|${r.ride_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push({ ride: r, source: r.source, ext: r });
  }
  // Only rides matching at least one endpoint — a different route is not a
  // match for this search, however cheap it is.
  const routePool = pool.filter((p) => routeMatchScore(p.ride, body) >= 0.5);
  const matches = matchRides(routePool.map((p) => p.ride), body).map((r) => {
    const entry = pool.find((p) => p.ride.id === r.id)!;
    return {
      ...r,
      source: entry.source,
      sourceUrl: entry.ext?.sourceUrl,
      trust: trustScore(r, entry.ext ? entry.ext.sourceVerified : (r.driver_verified ?? false)),
    };
  });
  const sources = [...new Set(matches.map((m) => m.source))];
  return NextResponse.json({
    matches,
    sources,
    source: matches.length ? 'multi' : 'none',
    note: matches.length
      ? undefined
      : `No original rides found for this route. Checked: ${[...new Set(pool.map((p) => p.source))].join(', ') || 'no live source connected'} — Hamsafar rides will appear once Supabase is connected and drivers post rides.`,
  });
}
