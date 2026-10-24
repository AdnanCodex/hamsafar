// Parser unit test — fixture built from the real Sawarri board cards
// observed 2026-10-24 (no network call here).
import { parseSawarriBoard } from '../lib/sawarri.ts';

const fixture = `
<a href="https://sawarri.com/ride/wah-to-lahore/">Wah Lahore <b>Rs 3,000</b> per seat, per trip Tomorrow 20:29 4 seats left</a>
<a href="https://sawarri.com/ride/shadbagh-lahore-to-islamabad/">Shadbagh Lahore Islamabad <b>Rs 2,500</b> per seat, per trip Today 7:00 4 seats left</a>
<a href="https://sawarri.com/ride/gujranwala-to-lahore-dha-phase-1/">Gujranwala Lahore / DHA Phase 1 <b>Rs 1,000</b> per seat, per trip Tuesday 20:00 4 seats left</a>
<a href="https://sawarri.com/ride/hyderabad-to-karachi/">Hyderabad Karachi <b>Negotiable</b> fare Posted 2 days ago 2 seats left</a>
`;

const rides = parseSawarriBoard(fixture);
console.log(`parsed ${rides.length} rides (expect 3 — Negotiable skipped)`);
for (const r of rides) {
  console.log(` - ${r.from_area} -> ${r.to_area} | PKR ${r.price_per_seat} | ${r.ride_date} ${r.ride_time} | ${r.seats_left} seats | ${r.source} | ${r.sourceUrl}`);
}
const ok =
  rides.length === 3 &&
  rides[0].from_area === 'Wah' && rides[0].to_area === 'Lahore' && rides[0].price_per_seat === 3000 &&
  rides[1].from_area === 'Shadbagh Lahore' && rides[1].to_area === 'Islamabad' && rides[1].price_per_seat === 2500;
console.log(ok ? 'PARSER TEST: PASS' : 'PARSER TEST: FAIL');
process.exit(ok ? 0 : 1);
