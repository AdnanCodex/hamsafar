import type { Ride } from './types';
import { supabase, supabaseConfigured } from './supabase';
import { fetchSawarriBoard } from './sawarri';
import type { ExternalRide } from './external-sources';

// ORIGINAL rides only — the single source of truth for every listing surface
// (Find, Rides, Recommendations, AI chat). No demo fallback anywhere: if no
// live source returns a ride, callers show an honest empty state.
//
// LISTING RULE (rider data first, then list):
// A Supabase driver is listed once they have submitted the COMPLETE
// verification dataset (verification_status 'pending' or 'verified').
// Their badge tells the truth: 'Verified' only after admin approval
// (cnic_verified=true), otherwise 'Verification pending'. A driver who
// submitted nothing is never listed. Sources: Supabase + Sawarri public
// board (real Pakistani carpool listings, each with sourceUrl). Partner APIs
// are merged separately by callers that know the requested route.

export interface ListedDriver {
  id: string;
  cnic_verified: boolean;
}

export async function fetchListedDrivers(): Promise<ListedDriver[]> {
  if (!supabaseConfigured || !supabase) return [];
  // Prefer the verification_status gate; fall back to the old verified-only
  // query if the column predates the verification_data migration.
  const { data, error } = await supabase
    .from('profiles')
    .select('id, cnic_verified')
    .in('verification_status', ['pending', 'verified']);
  if (!error && data) return data as ListedDriver[];
  const fallback = await supabase.from('profiles').select('id, cnic_verified').eq('cnic_verified', true);
  return (fallback.data || []) as ListedDriver[];
}

export interface OriginalRideEntry {
  ride: Ride;
  source: string;
  ext?: ExternalRide;
}

export async function getOriginalRidesBase(): Promise<OriginalRideEntry[]> {
  const [drivers, sawarriRides] = await Promise.all([
    fetchListedDrivers(),
    fetchSawarriBoard(),
  ]);
  const verifiedByDriver = new Map(drivers.map((d) => [d.id, d.cnic_verified]));
  const seen = new Set<string>();
  const out: OriginalRideEntry[] = [];
  const push = (ride: Ride, source: string, ext?: ExternalRide) => {
    const key = `${ride.driver_name}|${ride.from_area}|${ride.to_area}|${ride.ride_time}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ ride, source, ext });
  };
  if (drivers.length && supabaseConfigured && supabase) {
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'active')
      .in('driver_id', drivers.map((d) => d.id))
      .order('ride_time');
    for (const r of (data || []) as Ride[]) {
      push({ ...r, driver_verified: verifiedByDriver.get(r.driver_id) ?? false }, 'supabase');
    }
  }
  sawarriRides.forEach((r) => push({ ...r, driver_verified: false }, 'sawarri.com', r));
  return out;
}
