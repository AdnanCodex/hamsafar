// Authorization helper — API routes ke liye.
// Client `Authorization: Bearer <supabase-access-token>` bhejta hai.
// Token verify hota hai Supabase se; demo mode me auth skip hota hai
// (lekin production me token ke baghair write APIs 401 deti hain).
import { supabase, supabaseConfigured } from './supabase';

export interface AuthedUser {
  id: string;
  email?: string;
  role?: string;
  cnic_verified?: boolean;
  verification_status?: string;
}

export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  if (!supabaseConfigured || !supabase) return null;
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  // Profile se role + verification status (RLS ke andar, service nahi — user ka apna token).
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, cnic_verified, verification_status')
    .eq('id', data.user.id)
    .single();
  return {
    id: data.user.id,
    email: data.user.email,
    role: (profile as { role?: string } | null)?.role,
    cnic_verified: (profile as { cnic_verified?: boolean } | null)?.cnic_verified,
    verification_status: (profile as { verification_status?: string } | null)?.verification_status,
  };
}

// LISTING RULE: a driver may offer a ride once the complete verification
// dataset is submitted (status pending or verified). 'Verified' badge only
// comes from admin approval (cnic_verified); pending drivers are listed
// with 'Verification pending'. A driver who submitted nothing is not listed.
export function canOfferRide(user: AuthedUser | null): boolean {
  if (!user) return false;
  if (user.role !== 'driver' && user.role !== 'both') return false;
  return user.verification_status === 'pending' || user.verification_status === 'verified';
}

export function unauthorizedResponse(msg = 'Login required — please sign in first.') {
  return new Response(JSON.stringify({ error: msg }), { status: 401, headers: { 'Content-Type': 'application/json' } });
}

export function forbiddenResponse(msg = 'You are not allowed to do this.') {
  return new Response(JSON.stringify({ error: msg }), { status: 403, headers: { 'Content-Type': 'application/json' } });
}
