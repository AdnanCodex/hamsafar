import type { Ride } from './types';

// External rides integration — other online ride sources, plugged in by URL.
//
// HOW A SOURCE CONNECTS (partner API contract):
//   GET {url}?from=<area>&to=<area>  (optional header: Authorization: Bearer <key>)
//   Response: { rides: [...] } or a bare [...] array, where each ride has:
//     id, driver_name, driver_rating, driver_trips, women_only, vehicle,
//     from_area, to_area, ride_date, ride_time, seats_total, seats_left,
//     price_per_seat, verified (true = driver verified by that source).
// Set one or more URLs, comma-separated, in EXTERNAL_RIDES_API_URL.
// One shared key for all partners goes in EXTERNAL_RIDES_API_KEY (optional).
//
// HONEST LIMIT: Pakistani ride platforms (Bykea, InDrive, Careem) publish no
// public ride API, so no built-in adapter for them exists here. A partner that
// exposes the contract above works immediately; anything else needs that
// partner's written API access first. Nothing is scraped — scraping ride
// platforms would break their terms and return unreliable data.
//
// Every ride returned here carries `source` (the provider's hostname) so the
// UI can show exactly where each recommendation came from. A source that
// fails, times out, or returns invalid rows is skipped, never fatal.

export interface ExternalRide extends Ride {
  source: string; // provider hostname, e.g. "partner.example.com"
  sourceVerified: boolean; // verified by the external source itself
  sourceUrl?: string; // link back to the original listing for verification/booking
}

const TIMEOUT_MS = 5000;

export function externalSourceUrls(): string[] {
  const raw = process.env.EXTERNAL_RIDES_API_URL || '';
  return raw.split(',').map((u) => u.trim()).filter(Boolean);
}

function isValidRow(r: Record<string, unknown>): boolean {
  return (
    typeof r.from_area === 'string' && r.from_area.length > 0 &&
    typeof r.to_area === 'string' && r.to_area.length > 0 &&
    typeof r.price_per_seat !== 'undefined' && Number.isFinite(Number(r.price_per_seat)) &&
    Number(r.price_per_seat) > 0
  );
}

function normalize(r: Record<string, unknown>, source: string): ExternalRide {
  return {
    id: `ext-${source}-${String(r.id ?? Math.random().toString(36).slice(2))}`,
    driver_id: `ext:${source}:${String(r.driver_id ?? 'unknown')}`,
    driver_name: String(r.driver_name ?? 'Partner Driver'),
    driver_rating: Number(r.driver_rating ?? 4.5),
    driver_trips: Number(r.driver_trips ?? 0),
    women_only: Boolean(r.women_only),
    vehicle: String(r.vehicle ?? 'Partner vehicle'),
    from_area: String(r.from_area),
    to_area: String(r.to_area),
    ride_date: String(r.ride_date ?? new Date().toISOString().slice(0, 10)),
    ride_time: String(r.ride_time ?? '09:00'),
    seats_total: Number(r.seats_total ?? 3),
    seats_left: Number(r.seats_left ?? 1),
    price_per_seat: Number(r.price_per_seat),
    status: 'active',
    source,
    sourceVerified: Boolean(r.verified),
  };
}

async function fetchOne(base: string, from: string, to: string): Promise<ExternalRide[]> {
  let hostname = base;
  try { hostname = new URL(base).hostname; } catch { /* keep raw string */ }
  try {
    const url = `${base}${base.includes('?') ? '&' : '?'}from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: process.env.EXTERNAL_RIDES_API_KEY
        ? { Authorization: `Bearer ${process.env.EXTERNAL_RIDES_API_KEY}` }
        : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data.rides) ? data.rides : [];
    return (list as Record<string, unknown>[]).filter(isValidRow).map((r: Record<string, unknown>) => normalize(r, hostname));
  } catch {
    return []; // timeout / network error / bad JSON -> source skipped
  }
}

export async function fetchExternalRides(from: string, to: string): Promise<ExternalRide[]> {
  const urls = externalSourceUrls();
  if (!urls.length) return [];
  const batches = await Promise.all(urls.map((u) => fetchOne(u, from, to)));
  // Dedupe across sources: same driver + route + time = one ride (first source wins).
  const seen = new Set<string>();
  const out: ExternalRide[] = [];
  for (const r of batches.flat()) {
    const key = `${r.driver_name}|${r.from_area}|${r.to_area}|${r.ride_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
