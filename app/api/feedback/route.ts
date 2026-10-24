import { NextResponse } from 'next/server';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/feedback { rideId, source, outcome: 'booked'|'dismissed', rating? }
// Real retraining data for the recommendation classifier. In demo mode there
// is no live database, so feedback is NOT silently pretended to be stored —
// the response says so honestly. Once Supabase is connected, rows land in
// recommendation_feedback (see supabase/migrations/feedback.sql) and the
// next training run uses them instead of the cold-start seed labels.
export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  if (!body.rideId || !['booked', 'dismissed'].includes(body.outcome)) {
    return NextResponse.json({ error: 'rideId and outcome (booked|dismissed) are required' }, { status: 400 });
  }
  if (!supabaseConfigured || !supabase) {
    return NextResponse.json({
      stored: false,
      reason: 'Demo mode — no live database connected, so this feedback was not stored. Connect Supabase to collect real training data.',
    });
  }
  const { error } = await supabase.from('recommendation_feedback').insert({
    ride_id: String(body.rideId),
    source: String(body.source ?? 'supabase'),
    outcome: body.outcome,
    rating: body.rating ? Number(body.rating) : null,
  });
  if (error) return NextResponse.json({ error: 'Could not store feedback' }, { status: 500 });
  return NextResponse.json({ stored: true });
}
