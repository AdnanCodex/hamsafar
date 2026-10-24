import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/verify { user_id, decision: 'approve' | 'reject', admin_key? }
// CNIC verification — PROPER tareeqa:
//  1. Format validation (profile API par ho chuka hota hai)
//  2. Document check: admin Supabase dashboard / is API se CNIC document dekh kar
//     approve karta hai (NADRA ki koi public verification API nahi hai).
//  3. Approve hote hi cnic_verified=true aur uski rides listings me aa jati hain.
// Admin key: env ADMIN_VERIFY_KEY. Demo mode me key ke baghair bhi chalta hai
// (sirf demo data par, live par nahi).
export async function POST(req: Request) {
  const rl = rateLimit(req, 'write');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  if (!body.user_id || !['approve', 'reject'].includes(body.decision)) {
    return NextResponse.json({ error: 'user_id and decision (approve|reject) required' }, { status: 400 });
  }
  const adminKey = process.env.ADMIN_VERIFY_KEY;
  if (supabaseConfigured) {
    // SECURITY: live mode without a configured admin key must NOT approve
    // anyone — previously a missing key silently skipped the check.
    if (!adminKey) {
      return NextResponse.json({ error: 'Admin verification is not configured (ADMIN_VERIFY_KEY missing)' }, { status: 503 });
    }
    if (body.admin_key !== adminKey) {
      return NextResponse.json({ error: 'Admin key required' }, { status: 403 });
    }
  }
  const verified = body.decision === 'approve';
  if (!supabaseConfigured) {
    return NextResponse.json({
      ok: true,
      source: 'demo',
      user_id: body.user_id,
      verification_status: verified ? 'verified' : 'rejected',
      cnic_verified: verified,
      note: verified
        ? 'Demo: rider verified — in live mode their rides would now appear in listings.'
        : 'Demo: rider rejected — their rides will not be listed.',
    });
  }
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
  const { data, error } = await admin
    .from('profiles')
    .update({ verification_status: verified ? 'verified' : 'rejected', cnic_verified: verified, verified_at: verified ? new Date().toISOString() : null })
    .eq('id', body.user_id)
    .select('id, full_name, verification_status, cnic_verified')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, profile: data, source: 'supabase' });
}
