import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route protection (authorization) — browser pages ke liye.
// Supabase session cookies (sb-*-auth-token) check hoti hain; na hon to /login.
// Note: API routes apna token check khud karti hain (lib/auth.ts), kyunke
// wahan Bearer token aata hai, cookie nahi.
const PROTECTED_PAGES = ['/offer', '/dashboard'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!needsAuth) return NextResponse.next();
  const hasSession = req.cookies.getAll().some((c) => c.name.includes('-auth-token'));
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/offer/:path*', '/dashboard/:path*'] };
