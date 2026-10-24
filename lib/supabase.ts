import { createClient } from '@supabase/supabase-js';

// Browser/server client. Env vars na hon to client null hota hai aur app
// demo data par chalti hai — is se build kabhi env ki wajah se fail nahi hota.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

export const supabase = url && anon
  ? createClient(url, anon)
  : (null as unknown as ReturnType<typeof createClient>);

// Server-only client (service role) — sirf API routes me use hota hai,
// kabhi browser bundle me nahi jata.
export function supabaseAdmin() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service);
}
