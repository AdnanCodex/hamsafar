// Train the recommendation classifier (logistic regression, no dependencies).
// Run:  node scripts/train-recommendations.ts
// Writes: lib/ml/weights.json  (weights, bias, standardizer, metrics, provenance)
//
// DATA PROVENANCE — READ BEFORE TRUSTING THIS MODEL:
// No real booking history exists yet, so v1 trains on COLD-START SEED data:
// feature vectors are sampled from realistic ranges and labelled by the
// documented rule below (not by real users). The model therefore learns a
// transparent starting policy, and its accuracy below measures "how well the
// model reproduces the labelling rule", NOT real-world booking prediction.
// Real accuracy only comes after retraining on /api/feedback outcomes
// (booked / dismissed / rated) from actual riders.
//
// SEED LABELLING RULE (label = 1 "should recommend"):
//   routeMatch == 1 AND timeMatch >= 0.7 AND driverRating >= 4.5 AND
//   pricePerKm <= 30 AND seatsLeft >= 1 AND verified == 1.
// 5% of labels are flipped to simulate noisy real-world outcomes.
// FEATURE ORDER (must match lib/ml/classifier.ts):
//   [routeMatch, timeMatch, pricePerKm, driverRating, seatsLeft, verified,
//    womenMatch, driverTrips]

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Deterministic PRNG so retraining is reproducible.
let seed = 42;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = (arr: number[]) => arr[Math.floor(rnd() * arr.length)];

interface Example { x: number[]; y: number }

function makeExample(): Example {
  const x = [
    pick([0, 0.5, 0.7, 1, 1]),            // routeMatch
    pick([0.1, 0.4, 0.7, 1, 1]),          // timeMatch
    8 + rnd() * 50,                        // pricePerKm (8..58 PKR/km)
    3.5 + rnd() * 1.5,                     // driverRating (3.5..5.0)
    Math.floor(rnd() * 5),                 // seatsLeft (0..4)
    pick([0, 1, 1]),                       // verified
    pick([0, 0.5, 1]),                     // womenMatch
    Math.floor(rnd() * 301),               // driverTrips (0..300)
  ];
  let y = (
    x[0] === 1 && x[1] >= 0.7 && x[3] >= 4.5 && x[2] <= 30 && x[4] >= 1 && x[5] === 1
  ) ? 1 : 0;
  if (rnd() < 0.05) y = 1 - y; // label noise
  return { x, y };
}

const N = 4000;
const all: Example[] = Array.from({ length: N }, makeExample);
// Shuffle + 80/20 split
for (let i = all.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [all[i], all[j]] = [all[j], all[i]];
}
const train = all.slice(0, 3200);
const test = all.slice(3200);

// Standardize on TRAIN only.
const D = 8;
const mean = Array.from({ length: D }, (_, i) => train.reduce((s, e) => s + e.x[i], 0) / train.length);
const std = Array.from({ length: D }, (_, i) => {
  const v = train.reduce((s, e) => s + (e.x[i] - mean[i]) ** 2, 0) / train.length;
  return Math.sqrt(v) || 1;
});
const z = (e: Example) => e.x.map((v, i) => (v - mean[i]) / std[i]);

// Logistic regression, full-batch gradient descent.
const w = new Array(D).fill(0);
let b = 0;
const lr = 0.1;
for (let epoch = 0; epoch < 500; epoch++) {
  const gw = new Array(D).fill(0);
  let gb = 0;
  for (const e of train) {
    const zi = z(e);
    const p = 1 / (1 + Math.exp(-(zi.reduce((s, v, i) => s + w[i] * v, 0) + b)));
    const err = p - e.y;
    for (let i = 0; i < D; i++) gw[i] += err * zi[i];
    gb += err;
  }
  for (let i = 0; i < D; i++) w[i] -= (lr * gw[i]) / train.length;
  b -= (lr * gb) / train.length;
}

function accuracy(set: Example[]): number {
  let ok = 0;
  for (const e of set) {
    const zi = z(e);
    const p = 1 / (1 + Math.exp(-(zi.reduce((s, v, i) => s + w[i] * v, 0) + b)));
    if ((p >= 0.5 ? 1 : 0) === e.y) ok++;
  }
  return ok / set.length;
}
const trainAcc = accuracy(train);
const testAcc = accuracy(test);
console.log(`train accuracy: ${(trainAcc * 100).toFixed(1)}%  |  holdout accuracy: ${(testAcc * 100).toFixed(1)}%  (n=${test.length})`);
console.log(`weights: [${w.map((v) => v.toFixed(3)).join(', ')}] bias: ${b.toFixed(3)}`);

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, '..', 'lib', 'ml', 'weights.json'), JSON.stringify({
  version: 'logistic-regression-v1-coldstart',
  trained_at: new Date().toISOString(),
  features: ['routeMatch', 'timeMatch', 'pricePerKm', 'driverRating', 'seatsLeft', 'verified', 'womenMatch', 'driverTrips'],
  weights: w,
  bias: b,
  mean,
  std,
  metrics: { train_accuracy: Math.round(trainAcc * 1000) / 1000, holdout_accuracy: Math.round(testAcc * 1000) / 1000, train_n: train.length, test_n: test.length },
  provenance: 'Cold-start seed data labelled by a documented rule (see scripts/train-recommendations.ts). NOT real user booking data. Retrain on /api/feedback outcomes when live data exists.',
}, null, 2) + '\n');
console.log('wrote lib/ml/weights.json');
