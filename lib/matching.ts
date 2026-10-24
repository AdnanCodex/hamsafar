import type { Ride } from './types';

// AI Smart Matching — rider ki request ko best rides se rank karta hai.
// Score 0–100: route match (40), time closeness (25), price value (15),
// driver rating (10), seats available (10). Women-only preference hard filter hai.
export interface MatchRequest {
  from: string;
  to: string;
  time?: string; // "HH:MM"
  maxPrice?: number;
  womenOnly?: boolean;
  minRating?: number;
}

export interface ScoredRide extends Ride {
  score: number;
  reasons: string[];
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function routeScore(a: string, b: string): number {
  if (norm(a) === norm(b)) return 1;
  if (norm(a).includes(norm(b)) || norm(b).includes(norm(a))) return 0.7;
  // Town / Phase jese lafz match hon to partial credit
  const aw = new Set(norm(a).split(/town|phase|road/).filter(Boolean));
  const bw = new Set(norm(b).split(/town|phase|road/).filter(Boolean));
  for (const w of aw) if (bw.has(w)) return 0.5;
  return 0;
}

function minutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function matchRides(rides: Ride[], req: MatchRequest): ScoredRide[] {
  let pool = rides.filter((r) => r.status === 'active' && r.seats_left > 0);
  if (req.womenOnly) pool = pool.filter((r) => r.women_only);
  const maxPrice = req.maxPrice;
  if (maxPrice) pool = pool.filter((r) => r.price_per_seat <= maxPrice);
  const minRating = req.minRating;
  if (minRating) pool = pool.filter((r) => (r.driver_rating ?? 0) >= minRating);

  return pool
    .map((r) => {
      const reasons: string[] = [];
      const fromS = routeScore(r.from_area, req.from);
      const toS = routeScore(r.to_area, req.to);
      const route = ((fromS + toS) / 2) * 40;
      if (fromS === 1 && toS === 1) reasons.push('Exact route match');
      else if (route >= 20) reasons.push('Nearby route');

      let time = 15;
      if (req.time) {
        const diff = Math.abs(minutes(r.ride_time) - minutes(req.time));
        time = diff <= 30 ? 25 : diff <= 60 ? 18 : diff <= 120 ? 10 : 4;
        if (diff <= 30) reasons.push('Close to your time');
      }
      const cheapest = Math.min(...pool.map((x) => x.price_per_seat));
      const price = cheapest > 0 ? Math.max(0, 15 - ((r.price_per_seat - cheapest) / cheapest) * 15) : 15;
      if (r.price_per_seat === cheapest) reasons.push('Cheapest option');
      const rating = ((r.driver_rating ?? 4) / 5) * 10;
      if ((r.driver_rating ?? 0) >= 4.8) reasons.push('Top rated driver');
      const seats = Math.min(10, r.seats_left * 3);
      const score = Math.round(route + time + price + rating + seats);
      return { ...r, score, reasons };
    })
    .filter((r) => r.score >= 25)
    .sort((a, b) => b.score - a.score);
}

// AI Trust Score — driver ka bharosa score (verification + rating + trips).
// isVerified=false (e.g. unverified external board rides) gets NO verification
// points — an unverified driver must never look "Highly Trusted".
export function trustScore(r: Ride, isVerified = true): { score: number; label: string } {
  const rating = ((r.driver_rating ?? 4.25) / 5) * 50;
  const trips = Math.min(30, (r.driver_trips ?? 0) / 10);
  const verified = isVerified ? 20 : 0;
  const score = Math.round(rating + trips + verified);
  return {
    score,
    label: score >= 85 ? 'Highly Trusted' : score >= 70 ? 'Trusted' : 'New Driver',
  };
}
