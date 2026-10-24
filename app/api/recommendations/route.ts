import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/recommendations';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/recommendations { from, to, time?, womenOnly?, limit? }
// Multi-source: Supabase verified rides + external partner/website APIs +
// demo fallback (flagged isDemo: true). Every ride is classified by the
// trained logistic-regression model (model version in the response).
// Demo rides are NEVER presented as real: isDemo + 'demo' in sources.
export async function POST(req: Request) {
  const rl = rateLimit(req, 'read');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  if (!body.from || !body.to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }
  const result = await getRecommendations({ ...body, limit: body.limit ?? 10 });
  return NextResponse.json({ ...result, source: result.matches.length ? 'multi' : 'none' });
}
