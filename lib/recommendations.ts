import type { Ride } from './types';
import { matchRides, type MatchRequest } from './matching';
import { fetchExternalRides, type ExternalRide } from './external-sources';
import { getOriginalRidesBase, type OriginalRideEntry } from './original-rides';
import { classifyRide, extractFeatures, extractFeaturesExternal, routeMatchScore, MODEL_VERSION } from './ml/classifier';
import { roadDistanceKm } from './distance';

// Recommendations — ORIGINAL DATA ONLY. No demo fallback, ever.
// Sources (in priority order):
//   1. Supabase rides from drivers who submitted the complete verification
//      dataset (badge 'Verified' only after admin approval, otherwise
//      'Verification pending' — nobody is listed without full data).
//   2. Sawarri public ride board (sawarri.com — real Pakistani carpool
//      listings; see lib/sawarri.ts for what is taken and what is not).
//   3. External partner/website APIs via EXTERNAL_RIDES_API_URL
//      (see lib/external-sources.ts for the contract).
// If no live source returns a ride, the result is EMPTY with an honest note
// — never a demo ride dressed up as a recommendation. Every candidate is
// classified by the trained logistic-regression model (lib/ml/classifier.ts).
// Final order: classifier label first, then the match score.

export interface ClassifiedRide extends Ride {
  score: number;
  reasons: string[];
  classification: 'Recommended' | 'Not Recommended';
  probability: number;
  source: string; // 'supabase' | 'sawarri.com' | provider hostname
  sourceUrl?: string;
}

export async function getRecommendations(req: MatchRequest & { limit?: number }) {
  const [base, extRides] = await Promise.all([
    getOriginalRidesBase(),
    fetchExternalRides(req.from, req.to),
  ]);

  // Merge live sources, dedupe across them (driver+route+time).
  const seen = new Set<string>();
  const pool: OriginalRideEntry[] = [];
  const push = (ride: Ride, source: string, ext?: ExternalRide) => {
    const key = `${ride.driver_name}|${ride.from_area}|${ride.to_area}|${ride.ride_time}`;
    if (seen.has(key)) return;
    seen.add(key);
    pool.push({ ride, source, ext });
  };
  base.forEach((b) => push(b.ride, b.source, b.ext));
  extRides.forEach((r) => push(r, r.source, r));

  const sources = [...new Set(pool.map((p) => p.source))];
  if (!pool.length) {
    return {
      matches: [] as ClassifiedRide[],
      sources: [] as string[],
      totalSources: 0,
      model: MODEL_VERSION,
      isDemo: false,
      note: 'No recommendations available yet. Live rides will appear here once Supabase is connected (real Hamsafar drivers who submitted full verification data) or a partner source is added. Sawarri board rides appear only when they match your route.',
    };
  }

  // A ride for a different route is not a recommendation for this query,
  // however cheap it is — drop candidates matching neither endpoint.
  const routePool = pool.filter((p) => routeMatchScore(p.ride, req) >= 0.5);
  const scored = matchRides(routePool.map((p) => p.ride), req);
  const distanceKm = (await roadDistanceKm(req.from, req.to)) ?? 12;
  const classified: ClassifiedRide[] = scored.map((s) => {
    const entry = routePool.find((p) => p.ride.id === s.id)!;
    const features = entry.ext
      ? extractFeaturesExternal(entry.ext, req, distanceKm)
      : extractFeatures(s, req, distanceKm);
    const c = classifyRide(features);
    return {
      ...s,
      classification: c.label,
      probability: c.probability,
      source: entry.source,
      sourceUrl: entry.ext?.sourceUrl,
    };
  });

  // Recommended first, then by match score.
  classified.sort((a, b) =>
    (a.classification === b.classification ? 0 : a.classification === 'Recommended' ? -1 : 1) ||
    b.score - a.score,
  );

  const anyRecommended = classified.some((c) => c.classification === 'Recommended');
  const matchedSources = [...new Set(classified.map((c) => c.source))];
  return {
    matches: classified.slice(0, req.limit ?? 10),
    sources: matchedSources,
    totalSources: matchedSources.length,
    model: MODEL_VERSION,
    isDemo: false,
    distanceKm,
    note: classified.length === 0
      ? `No original rides found for this route. Checked: ${sources.join(', ') || 'no live source connected'} — rides for this route will appear here once real Hamsafar drivers post them (Supabase live).`
      : anyRecommended
        ? undefined
        : 'No ride fully met the recommendation policy yet (verified driver, high rating, fair price) — the original listings below are the closest matches for this route, with their classification shown.',
  };
}
