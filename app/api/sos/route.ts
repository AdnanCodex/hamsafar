import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { getAuthedUser, unauthorizedResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/validation';

// POST /api/sos — Emergency SOS alert.
// Live mode: sos_alerts table me save + (production me) emergency contacts ko
// SMS/push notification jayegi (SMS provider ke baad). Demo mode: alert return,
// koi asli SMS nahi jata — UI me saaf likha hota hai.
export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  const alert = {
    latitude: typeof body.latitude === 'number' ? body.latitude : null,
    longitude: typeof body.longitude === 'number' ? body.longitude : null,
    message: sanitizeText(body.message || 'Emergency! I need help.', 300),
    status: 'active' as const,
  };
  if (!supabaseConfigured) {
    return NextResponse.json({
      ok: true,
      source: 'demo',
      alert: { id: `demo-sos-${Date.now()}`, ...alert, created_at: new Date().toISOString() },
      notified: [],
      note: 'Demo SOS — no real SMS/push was sent. In live mode, emergency contacts will be notified (after SMS provider setup).',
    });
  }
  const user = await getAuthedUser(req);
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
  const { data, error } = await admin
    .from('sos_alerts')
    .insert({ user_id: user?.id ?? null, ...alert })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Emergency contacts fetch (notification list — SMS provider ke baad use hoga).
  let contacts: unknown[] = [];
  if (user) {
    const { data: c } = await admin.from('emergency_contacts').select('name, phone').eq('user_id', user.id);
    contacts = c || [];
  }
  return NextResponse.json({ ok: true, source: 'supabase', alert: data, notified: contacts });
}

// GET /api/sos — your own alerts (live mode requires auth; demo returns empty).
export async function GET(req: Request) {
  if (!supabaseConfigured) {
    return NextResponse.json({ alerts: [], source: 'demo' });
  }
  const user = await getAuthedUser(req);
  if (!user) return unauthorizedResponse();
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
  const { data, error } = await admin
    .from('sos_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data || [], source: 'supabase' });
}
