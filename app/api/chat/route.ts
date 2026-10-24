import { NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assistantReply } from '@/lib/ai';

// POST /api/chat { message } — Gemini key ho to LLM, warna rule-based AI.
export async function POST(req: Request) {
  const rl = rateLimit(req, 'chat');
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const body = await req.json();
  const message = (body.message || '').toString().trim();
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });
  if (message.length > 1000) return NextResponse.json({ error: 'message too long' }, { status: 400 });
  const reply = await assistantReply(message);
  return NextResponse.json(reply);
}
