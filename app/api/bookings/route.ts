import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getAuthedUser, unauthorizedResponse } from '@/lib/auth';

// POST /api/bookings { ride_id, seats, total_price }
// Live mode me Supabase me booking + seats_left kam hota hai (transaction jesa).
export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  let riderId = body.rider_id ?? null;
  if (supabaseConfigured) {
    const user = await getAuthedUser(req);
    if (!user) return unauthorizedResponse();
    riderId = user.id;
  }
  if (!body.ride_id || !body.total_price) {
    return NextResponse.json({ error: 'ride_id and total_price required' }, { status: 400 });
  }
  if (!supabaseConfigured) {
    return NextResponse.json({
      ok: true,
      source: 'demo',
      note: 'Demo booking — set env vars for live Supabase.',
      booking: { id: `demo-bk-${Date.now()}`, ...body, status: 'confirmed' },
    });
  }
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server Supabase config missing' }, { status: 500 });
  const { data: ride, error: rideErr } = await admin
    .from('rides')
    .select('seats_left')
    .eq('id', body.ride_id)
    .single();
  if (rideErr || !ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
  const seats = body.seats || 1;
  if (ride.seats_left < seats) return NextResponse.json({ error: 'No seats left' }, { status: 409 });
  await admin.from('rides').update({ seats_left: ride.seats_left - seats }).eq('id', body.ride_id);
  const { data, error } = await admin
    .from('bookings')
    .insert({ ride_id: body.ride_id, rider_id: riderId, seats, total_price: body.total_price, status: 'confirmed' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, booking: data, source: 'supabase' });
}
