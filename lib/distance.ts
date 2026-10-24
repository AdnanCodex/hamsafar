import type { Ride } from './types';

// Road distance between two areas, via public OpenStreetMap services:
// Nominatim (geocoding, no key) + OSRM demo server (routing, no key).
// Used ONLY for the classifier's price-per-km feature, so an intercity ride
// (e.g. Wah -> Lahore, ~280 km) is not scored as if it were a 12 km city trip.
// Both services are public and rate-limited: results are cached forever per
// area pair, and any failure returns null so the caller falls back to its
// default instead of failing the request. Respects Nominatim's usage policy
// (identifying User-Agent, cached results, no bulk geocoding).

const geoCache = new Map<string, { lat: number; lon: number } | null>();
const routeCache = new Map<string, number>();

async function geocode(area: string): Promise<{ lat: number; lon: number } | null> {
  const key = area.toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key)!;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pk&q=${encodeURIComponent(area + ', Pakistan')}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'HamsafarAggregator/1.0 (contact: support@hamsafar.pk)' },
    });
    if (!res.ok) { geoCache.set(key, null); return null; }
    const data = await res.json();
    const hit = Array.isArray(data) && data[0] ? { lat: Number(data[0].lat), lon: Number(data[0].lon) } : null;
    geoCache.set(key, hit);
    return hit;
  } catch {
    geoCache.set(key, null);
    return null;
  }
}

export async function roadDistanceKm(from: string, to: string): Promise<number | null> {
  const key = `${from.toLowerCase()}|${to.toLowerCase()}`;
  if (routeCache.has(key)) return routeCache.get(key)!;
  try {
    const [a, b] = await Promise.all([geocode(from), geocode(to)]);
    if (!a || !b) return null;
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const meters = data?.routes?.[0]?.distance;
    if (!meters || meters <= 0) return null;
    const km = Math.round(meters / 1000);
    routeCache.set(key, km);
    return km;
  } catch {
    return null;
  }
}
