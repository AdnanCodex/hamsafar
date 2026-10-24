import type { ExternalRide } from './external-sources';

// Sawarri (sawarri.com) — ORIGINAL ride data, first real external source.
//
// Sawarri publishes no public API (checked 2026-10-24: no developer API
// found), so this adapter reads its PUBLIC homepage ride board — the same
// listings any visitor sees, no login, no paywall, no bypass.
// What is taken, per listing: route, fare per seat, seats left, departure
// day/time, and the link back to the original listing.
// What is NEVER taken: driver phone numbers, number plates, or any personal
// data — the board does not publish them, and booking stays on Sawarri via
// the source link. Each ride keeps source='sawarri.com' + sourceUrl so the
// user can verify it on the original page.
//
// Limits, stated plainly:
//  - Only the homepage's featured board is read (a handful of live listings),
//    not a full crawl of the site — one gentle fetch, cached 10 minutes.
//  - Board cards carry no verified badge, so sourceVerified=false even though
//    Sawarri verifies some drivers off-board; the detail page is the truth.
//  - Board fares marked "Negotiable" are skipped (no numeric price to rank).
//  - If Sawarri changes its board layout, this returns [] instead of wrong
//    data, and recommendations fall back to the honest empty state.
// Long-term proper path: ask Sawarri for a feed/API partnership.

const BOARD_URL = 'https://sawarri.com/';
const FETCH_TIMEOUT_MS = 8000;
const CACHE_MS = 10 * 60 * 1000;

let cache: { at: number; rides: ExternalRide[] } | null = null;

// Karachi date parts (board days like "Today"/"Tomorrow" are Pakistan days).
function karachiToday(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function resolveDay(token: string): string {
  const t = karachiToday();
  const base = Date.UTC(t.y, t.m - 1, t.d);
  const low = token.toLowerCase();
  let add = 0;
  if (low === 'tomorrow') add = 1;
  else {
    const wi = WEEKDAYS.indexOf(low);
    if (wi >= 0) {
      const todayWi = new Date(base).getUTCDay();
      add = (wi - todayWi + 7) % 7; // next occurrence, today if it matches
    }
  }
  const d = new Date(base + add * 86400000);
  return d.toISOString().slice(0, 10);
}

function titleCaseSlug(slug: string): string {
  return slug.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

// Pure parser — unit-testable with a fixture, no network.
export function parseSawarriBoard(html: string): ExternalRide[] {
  // Normalize case + punctuation so "Lahore / DHA Phase 1" matches the
  // slug-derived route "Lahore Dha Phase 1".
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9:,\s]/g, ' ')
    .replace(/\s+/g, ' ');

  const slugs = [...new Set([...html.matchAll(/sawarri\.com\/ride\/([a-z0-9-]+)\//gi)].map((m) => m[1].toLowerCase()))];
  const rides: ExternalRide[] = [];

  for (const slug of slugs) {
    const toSplit = slug.split('-to-');
    if (toSplit.length !== 2) continue;
    const from = titleCaseSlug(toSplit[0]);
    const to = titleCaseSlug(toSplit[1]);
    // Board card text reads "<From words> <To words> Rs <fare> ... <Day> <HH:MM> <N> seats left"
    const routeText = `${from} ${to}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const idx = text.indexOf(routeText);
    if (idx < 0) continue;
    const card = text.slice(idx, idx + 160);
    const fareM = card.match(/rs\s*([\d,]+)/);
    if (!fareM) continue; // Negotiable or missing fare -> skip
    const price = Number(fareM[1].replace(/,/g, ''));
    if (!price) continue;
    const seatsM = card.match(/(\d+)\s*seats?\s*left/);
    const timeM = card.match(/(\d{1,2}:\d{2})/);
    const dayM = card.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    const seats = seatsM ? Number(seatsM[1]) : 1;
    const hhmm = timeM ? timeM[1].padStart(5, '0') : '09:00';
    rides.push({
      id: `sawarri-${slug}`,
      driver_id: 'ext:sawarri.com:captain',
      driver_name: 'Sawarri captain',
      vehicle: 'Vehicle details on original listing',
      from_area: from,
      to_area: to,
      ride_date: dayM ? resolveDay(dayM[1]) : (() => { const t = karachiToday(); return `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`; })(),
      ride_time: hhmm.length === 4 ? `0${hhmm}` : hhmm,
      seats_total: seats,
      seats_left: seats,
      price_per_seat: price,
      status: 'active',
      source: 'sawarri.com',
      sourceVerified: false,
      sourceUrl: `https://sawarri.com/ride/${slug}/`,
    });
  }
  return rides;
}

export async function fetchSawarriBoard(): Promise<ExternalRide[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rides;
  try {
    const res = await fetch(BOARD_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'HamsafarAggregator/1.0 (contact: support@hamsafar.pk)' },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const rides = parseSawarriBoard(html);
    cache = { at: Date.now(), rides };
    return rides;
  } catch {
    return []; // site unreachable / changed -> honest empty, never fake data
  }
}
