// AI Assistant — Gemini (LLM) jab key ho, warna rule-based assistant.
// Dono ka jawab aik jesa format me aata hai, is liye UI ko farq nahi parta.
import { getOriginalRidesBase } from './original-rides';
import { estimateFare } from './fare';

export interface ChatReply {
  text: string;
  source: 'gemini' | 'rules';
}

const SYSTEM_PROMPT = `You are Hamsafar Assistant, a helpful ride-sharing assistant for Pakistan (all provinces, including KPK and Hazara Division).
IMPORTANT: Always answer in English only, even if the user writes in another language.
Keep answers short and practical.
Services: find rides, offer rides, fares (fuel-cost sharing only, never commercial fares),
safety (verified drivers, women-only rides, SOS), payments (Cash, JazzCash, Easypaisa, Card).
Never invent a specific ride, price, or driver that is not in the provided context.
Never suggest a ride unless the user asks about finding, booking, or available rides.`;

async function geminiReply(userText: string, context: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: `Context (available rides):\n${context}\n\nUser: ${userText}` }] }],
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

function rulesReply(userText: string, originalRides: { from_area: string; to_area: string; ride_time: string; price_per_seat: number; seats_left: number; source: string; sourceUrl?: string }[]): string {
  const t = userText.toLowerCase().trim();
  // Greeting / small talk — sirf greeting ka jawab, koi ride suggest nahi.
  if (/^(hi+|hello|hey|assalam|salam|aoa|good (morning|afternoon|evening)|thanks|thank you|shukriya)\b/.test(t) || t.length <= 3) {
    return 'Hello! How can I help you today? You can ask me about finding a ride, fares, safety, or payments.';
  }
  if (t.includes('fare') || t.includes('price') || t.includes('cost')) {
    const e = estimateFare(12, 9, 0.2);
    return `A typical 12 km shared ride costs around PKR ${e.total} (${e.explanation}). The exact fare depends on your route distance — you can see a live estimate on the Find a Ride page.`;
  }
  if (t.includes('women') || t.includes('lady') || t.includes('female')) {
    return 'Women-only rides are available: turn on the "Women only" filter on the Find a Ride page. Only verified women drivers will be shown, and you can also offer a women-only ride.';
  }
  if (t.includes('safe') || t.includes('safety') || t.includes('sos') || t.includes('verify')) {
    return 'For safety: every driver is CNIC-verified, every trip has live trip sharing and an SOS button, and ratings build a driver trust score. In an emergency, press SOS — your live location goes to your emergency contacts.';
  }
  if (t.includes('offer') || t.includes('post')) {
    return 'To offer a ride: on the Offer a Ride page, enter From, To, date, time, seats, and per-seat price (fuel-cost sharing). Your ride will be shown to verified riders.';
  }
  if (t.includes('payment') || t.includes('jazzcash') || t.includes('easypaisa') || t.includes('cash') || t.includes('card')) {
    return 'Payments: Cash (paid directly to the driver), JazzCash, Easypaisa, and Credit/Debit Card — all can be selected on the Confirm page.';
  }
  // Ride suggestion SIRF tab jab user ride dhoondhne/book karne ke bare me pooche,
  // aur SIRF original listings se — koi demo ride kabhi suggest nahi hoti.
  if (/(ride|find|book|available|search|driver|trip)/.test(t)) {
    if (originalRides.length) {
      const list = originalRides.slice(0, 3).map(
        (r) => `${r.from_area} → ${r.to_area}, ${r.ride_time}, PKR ${r.price_per_seat} per seat, ${r.seats_left} seats left (source: ${r.source})`
      ).join(' | ');
      return `Original rides available right now: ${list}. See the full list with booking on the Find a Ride and Recommendations pages.`;
    }
    return 'No original rides are available right now. Hamsafar rides will appear once Supabase is connected and drivers post rides, and Sawarri board rides appear when they match a route.';
  }
  return 'I can help with finding a ride, fare estimates, women-only rides, safety, and payments. What would you like to know?';
}

export async function assistantReply(userText: string): Promise<ChatReply> {
  const base = await getOriginalRidesBase();
  const originalRides = base.map((b) => ({
    from_area: b.ride.from_area, to_area: b.ride.to_area, ride_time: b.ride.ride_time,
    price_per_seat: b.ride.price_per_seat, seats_left: b.ride.seats_left,
    source: b.source, sourceUrl: b.ext?.sourceUrl,
  }));
  const context = originalRides.length
    ? originalRides.map((r) => `${r.from_area} → ${r.to_area}, ${r.ride_time}, PKR ${r.price_per_seat}, ${r.seats_left} seats (source: ${r.source})`).join('\n')
    : 'No original rides available right now.';
  const llm = await geminiReply(userText, context);
  if (llm) return { text: llm, source: 'gemini' };
  return { text: rulesReply(userText, originalRides), source: 'rules' };
}
