import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route protection REMOVED at the owner's request (2026-10-24): login
// and signup were taken off the website, so no page may redirect users
// to a login form anymore. Previously this file redirected /offer and
// /dashboard to /login when no Supabase session cookie was present.
// To restore login gating, restore the previous middleware from git
// history together with the login page (backups/hamsafar-login-page-20261024.tsx).
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: ['/offer/:path*', '/dashboard/:path*'] };
