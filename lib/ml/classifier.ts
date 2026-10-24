import type { Ride } from '../types';
import type { MatchRequest } from '../matching';
import weights from './weights.json';

// Recommendation classifier — logistic regression, trained offline by
// scripts/train-recommendations.ts. It classifies ONE candidate ride for ONE
// rider request as Recommended (probability >= 0.5) or Not Recommended.
//
// FEATURES (fixed order, must match the training script):
//   0 routeMatch    0..1  (1 = exact from+to match, 0.5 = partial, 0 = no match)
//   1 timeMatch     0..1  (1 = within 30 min of requested time, decays after)
//   2 pricePerKm    PKR per km (standardized with training mean/std)
//   3 driverRating  0..5
//   4 seatsLeft     0..4+
//   5 verified      0/1  (CNIC-verified Hamsafar driver, or source-verified partner)
//   6 womenMatch    1 = matches a women-only request, 0 = conflicts, 0.5 = no preference
//   7 driverTrips   capped at 300 (standardized with training mean/std)
//
// COLD-START HONESTY: no real booking history exists yet, so v1 was trained
// on seed examples labelled by a documented rule (see the training script:
// exact route + time within 60 min + rating >= 4.5 + price <= 30/km +
// seats available + verified driver). It is a starting model, not proof from
// real users. As real outcomes arrive through /api/feedback (booked /
// dismissed / rated), retraining on that feedback replaces the seed labels.
// weights.json records the model version, training accuracy and provenance.

export const MODEL_VERSION = (weights as { version: string }).version;

export interface RideFeatures {
  routeMatch: number;
  timeMatch: number;
  pricePerKm: number;
  driverRating: number;
  seatsLeft: number;
  verified: number;
  womenMatch: number;
  driverTrips: number;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function areaScore(a: string, b: string): number {
  if (norm(a) === norm(b)) return 1;
  if (norm(a).includes(norm(b)) || norm(b).includes(norm(a))) return 0.7;
  return 0;
}

function minutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function routeMatchScore(ride: Ride, req: MatchRequest): number {
  return (areaScore(ride.from_area, req.from) + areaScore(ride.to_area, req.to)) / 2;
}

export function extractFeatures(ride: Ride, req: MatchRequest, distanceKm = 12): RideFeatures {
  const routeMatch = routeMatchScore(ride, req);
  let timeMatch = 0.5;
  if (req.time) {
    const diff = Math.abs(minutes(ride.ride_time) - minutes(req.time));
    timeMatch = diff <= 30 ? 1 : diff <= 60 ? 0.7 : diff <= 120 ? 0.4 : 0.1;
  }
  const womenMatch = req.womenOnly ? (ride.women_only ? 1 : 0) : 0.5;
  return {
    routeMatch,
    timeMatch,
    pricePerKm: ride.price_per_seat / Math.max(1, distanceKm),
    // Missing rating = training mean (mean imputation, documented) — an
    // unrated driver is neither rewarded nor punished for having no rating.
    driverRating: ride.driver_rating ?? 4.25,
    seatsLeft: ride.seats_left,
    // Supabase rides carry driver_verified (true only after admin approval);
    // unknown rides default to 0 — never assume verified. Partners use
    // extractFeaturesExternal (sourceVerified) instead.
    verified: ride.driver_verified === true ? 1 : 0,
    womenMatch,
    driverTrips: Math.min(300, ride.driver_trips ?? 0),
  };
}

export function extractFeaturesExternal(
  ride: Ride & { sourceVerified?: boolean },
  req: MatchRequest,
  distanceKm = 12,
): RideFeatures {
  const f = extractFeatures(ride, req, distanceKm);
  f.verified = ride.sourceVerified ? 1 : 0;
  return f;
}

export function classifyRide(f: RideFeatures): { probability: number; label: 'Recommended' | 'Not Recommended' } {
  const w = weights as {
    weights: number[];
    bias: number;
    mean: number[];
    std: number[];
  };
  const x = [
    f.routeMatch, f.timeMatch, f.pricePerKm, f.driverRating,
    f.seatsLeft, f.verified, f.womenMatch, f.driverTrips,
  ];
  let z = w.bias;
  for (let i = 0; i < x.length; i++) {
    z += w.weights[i] * ((x[i] - w.mean[i]) / (w.std[i] || 1));
  }
  const p = 1 / (1 + Math.exp(-z));
  return { probability: Math.round(p * 1000) / 1000, label: p >= 0.5 ? 'Recommended' : 'Not Recommended' };
}
