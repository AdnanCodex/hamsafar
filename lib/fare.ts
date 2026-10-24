// AI Fare Estimator — fuel-cost sharing model (commercial fare nahi).
// Inputs: distance (km), hour of day, demand (0..1). Output: per-seat fare + breakdown.
export interface FareEstimate {
  distanceKm: number;
  baseFare: number;
  timeSurcharge: number;
  demandSurcharge: number;
  serviceFee: number;
  total: number;
  explanation: string;
}

const FUEL_PER_KM = 32; // PKR, average car fuel cost per km (shared across seats)
const SEATS_SHARED = 3;

export function estimateFare(distanceKm: number, hour = 9, demand = 0.3): FareEstimate {
  const km = Math.max(1, distanceKm);
  const base = Math.round((km * FUEL_PER_KM) / SEATS_SHARED / 10) * 10;
  // Peak hours (8–10am, 5–8pm) me thora surcharge, raat me discount nahi.
  const peak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const timeSurcharge = peak ? Math.round(base * 0.1) : 0;
  const demandSurcharge = Math.round(base * Math.min(0.25, Math.max(0, demand)) );
  const fare = base + timeSurcharge + demandSurcharge;
  const serviceFee = fare >= 1000 ? 50 : 20;
  const parts: string[] = [
    `Fuel cost for ${km.toFixed(1)} km shared across ${SEATS_SHARED} seats: PKR ${base}.`,
  ];
  if (peak) parts.push('Peak-hour 10% surcharge applied.');
  if (demand > 0.15) parts.push(`High-demand adjustment of up to ${Math.round(demand * 100)}% applied.`);
  parts.push(`Service fee PKR ${serviceFee} (PKR 50 on rides of PKR 1,000+).`);
  return {
    distanceKm: km,
    baseFare: base,
    timeSurcharge,
    demandSurcharge,
    serviceFee,
    total: fare + serviceFee,
    explanation: parts.join(' '),
  };
}

// Haversine distance — do GPS points ke darmiyan seedhi doori (km).
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLa = ((b[0] - a[0]) * Math.PI) / 180;
  const dLo = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLa / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
