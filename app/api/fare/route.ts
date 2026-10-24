import { NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { estimateFare, haversineKm } from '@/lib/fare';

// POST /api/fare { distanceKm? } ya { pickup: [lat,lng], dropoff: [lat,lng], hour?, demand? }
export async function POST(req: Request) {
  const rl = rateLimit(req, 'read');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  let distance = body.distanceKm as number | undefined;
  if (!distance && body.pickup && body.dropoff) {
    distance = haversineKm(body.pickup, body.dropoff) * 1.35; // road distance approx
  }
  if (!distance || distance <= 0) {
    return NextResponse.json({ error: 'distanceKm or pickup/dropoff required' }, { status: 400 });
  }
  const estimate = estimateFare(distance, body.hour ?? 9, body.demand ?? 0.3);
  return NextResponse.json({ estimate });
}
