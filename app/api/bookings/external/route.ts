import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getAuthedUser, unauthorizedResponse } from '@/lib/auth';

// In-app booking for EXTERNAL rides (e.g. Sawarri board listings).
// The rider's journey stays inside Hamsafar: request -> contact driver
// (through the original listing, in a NEW tab, only when the rider taps it)
// -> rider marks driver-confirmed. Hamsafar never auto-redirects away, and
// takes NO fee on external rides — the rider pays the driver directly.
//
// POST { action: 'request', ride: {id, from_area, to_area, ride_date, ride_time,
//   price_per_seat, source, sourceUrl}, seats }
//   -> { ok, request: { id, status: 'pending_driver_confirmation', total_price } }
// POST { action: 'confirm', requestId }
//   -> { ok, request: { id, status: 'confirmed' } }
// In demo mode nothing is stored live; the response says so honestly and the
// status is NEVER 'confirmed' on request — only after the confirm step.
export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();

  if (body.action === 'confirm') {
    if (!body.requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 });
    if (!supabaseConfigured) {
      return NextResponse.json({
        ok: true, source: 'demo',
        note: 'Demo mode — confirmation recorded in this session only, not in a live database.',
        request: { id: body.requestId, status: 'confirmed' },
      });
    }
    const user = await getAuthedUser(req);
    if (!user) return unauthorizedResponse();
    const admin = supabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'Server Supabase config missing' }, { status: 500 });
    const { data, error } = await admin
      .from('external_booking_requests')
      .update({ status: 'confirmed' })
      .eq('id', body.requestId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, request: data, source: 'supabase' });
  }

  if (body.action !== 'request' || !body.ride) {
    return NextResponse.json({ error: "action must be 'request' or 'confirm'" }, { status: 400 });
  }
  const ride = body.ride;
  const seats = Math.max(1, Number(body.seats || 1));
  const totalPrice = Number(ride.price_per_seat) * seats; // no Hamsafar fee on external rides

  if (!supabaseConfigured) {
    return NextResponse.json({
      ok: true, source: 'demo',
      note: 'Demo mode — request recorded in this session only. In live mode it is saved to external_booking_requests.',
      request: {
        id: `demo-ext-${Date.now()}`,
        ride_source: ride.source || 'external',
        source_url: ride.sourceUrl || null,
        from_area: ride.from_area, to_area: ride.to_area,
        ride_date: ride.ride_date, ride_time: ride.ride_time,
        seats, total_price: totalPrice, status: 'pending_driver_confirmation',
      },
    });
  }
  const user = await getAuthedUser(req);
  if (!user) return unauthorizedResponse();
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server Supabase config missing' }, { status: 500 });
  const { data, error } = await admin
    .from('external_booking_requests')
    .insert({
      rider_id: user.id,
      ride_source: ride.source || 'external',
      source_url: ride.sourceUrl || null,
      from_area: ride.from_area, to_area: ride.to_area,
      ride_date: ride.ride_date, ride_time: ride.ride_time,
      seats, total_price: totalPrice, status: 'pending_driver_confirmation',
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, request: data, source: 'supabase' });
}
