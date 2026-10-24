import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { getOriginalRidesBase } from '@/lib/original-rides';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getAuthedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

// GET /api/rides?from=&to= — ORIGINAL rides only (Supabase verified +
// Sawarri board). No demo fallback: no original ride = empty list + note.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const rl = rateLimit(req, 'read');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const pool = await getOriginalRidesBase();
  const filtered = pool.filter(
    (p) =>
      (!from || p.ride.from_area.toLowerCase().includes(from.toLowerCase())) &&
      (!to || p.ride.to_area.toLowerCase().includes(to.toLowerCase()))
  );
  const page = filtered.slice(offset, offset + limit);
  return NextResponse.json({
    rides: page.map((p) => ({ ...p.ride, source: p.source, sourceUrl: p.ext?.sourceUrl })),
    source: page.length ? 'multi' : 'none',
    sources: [...new Set(page.map((p) => p.source))],
    total: filtered.length,
    note: page.length
      ? undefined
      : 'No original rides found. Hamsafar rides will appear once Supabase is connected and drivers post rides.',
  });
}

// POST /api/rides — driver apni ride post karta hai (auth required jab live ho).
export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  // Live mode: sirf logged-in, verified driver hi ride offer kar sakta hai.
  let driverId = body.driver_id;
  if (supabaseConfigured) {
    const user = await getAuthedUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'driver' && user.role !== 'both') return forbiddenResponse('Only drivers can offer rides.');
    // LISTING RULE: a driver may offer a ride once the COMPLETE verification
    // dataset is submitted (status pending or verified). The ride then shows
    // 'Verification pending' until an admin approves it; a driver who
    // submitted nothing is never listed.
    if (user.verification_status !== 'pending' && user.verification_status !== 'verified') {
      return forbiddenResponse('Please submit your complete verification data first (Onboarding), then you can offer a ride.');
    }
    driverId = user.id;
  }
  const required = ['from_area', 'to_area', 'ride_date', 'ride_time', 'seats_total', 'price_per_seat'];
  for (const f of required) {
    if (body[f] === undefined || body[f] === '') {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 });
    }
  }
  if (!supabaseConfigured) {
    return NextResponse.json({
      ok: true,
      source: 'demo',
      note: 'Supabase is not configured — ride saved in demo mode. Set env vars for live mode.',
      ride: { ...body, id: `demo-${Date.now()}`, seats_left: body.seats_total, status: 'active' },
    });
  }
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server Supabase config missing' }, { status: 500 });
  const { data, error } = await admin
    .from('rides')
    .insert({ ...body, driver_id: driverId, seats_left: body.seats_total, status: 'active' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ride: data, source: 'supabase' });
}
