import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { getAuthedUser, unauthorizedResponse } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeText, isValidPhonePK } from '@/lib/validation';

// Emergency contacts — live mode stores them in Supabase (emergency_contacts
// table, see supabase/migrations/sos.sql) so SOS alerts can notify them.
// Demo mode (no Supabase): the SOS page keeps contacts in browser storage
// and this route reports that honestly instead of pretending to save.

// GET /api/contacts — your saved emergency contacts (live, auth required).
export async function GET(req: Request) {
  if (!supabaseConfigured) {
    return NextResponse.json({ contacts: [], source: 'demo', note: 'Demo mode — contacts are kept in browser storage only.' });
  }
  const user = await getAuthedUser(req);
  if (!user) return unauthorizedResponse();
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
  const { data, error } = await admin
    .from('emergency_contacts')
    .select('id, name, phone, relation')
    .eq('user_id', user.id)
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data || [], source: 'supabase' });
}

// POST /api/contacts { name, phone, relation? } — add one contact.
export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  const name = sanitizeText(body.name || '', 100);
  const phone = String(body.phone || '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  if (!isValidPhonePK(phone)) return NextResponse.json({ error: 'Phone must be in 03XX-XXXXXXX format' }, { status: 400 });
  if (!supabaseConfigured) {
    return NextResponse.json({
      ok: true, source: 'demo',
      note: 'Demo mode — contact kept in browser storage only, not in a live database.',
      contact: { id: `demo-contact-${Date.now()}`, name, phone, relation: sanitizeText(body.relation || '', 50) },
    });
  }
  const user = await getAuthedUser(req);
  if (!user) return unauthorizedResponse();
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
  const { data, error } = await admin
    .from('emergency_contacts')
    .insert({ user_id: user.id, name, phone, relation: sanitizeText(body.relation || '', 50) })
    .select('id, name, phone, relation')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, contact: data, source: 'supabase' });
}
