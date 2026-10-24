# Hamsafar — Ride Together. Go Further.

A ride-sharing and carpooling web app for **all of Pakistan** — from Hazara
(Mansehra, Abbottabad, Haripur) to Karachi. Fuel-cost sharing between riders
and drivers, with safety built in: identity verification, SOS, women-only
rides, live trip sharing, and trust scores.

> **Live demo:** _URL added after the Vercel deploy — see “Deployment” below._

## What it does

- **Find a Ride** — AI smart matching (route, time, price, rating, seats)
  plus a trained ride-recommendation classifier.
- **Offer a Ride** — drivers post rides only after submitting their complete
  verification dataset (see “Verification” below).
- **Recommendations** — ranked only from **original data**: verified
  Supabase rides, the public Sawarri ride board, and optional partner APIs.
  A route with no original ride stays honestly empty — no invented rides.
- **AI Fare Estimator** — fuel-cost sharing model (PKR 32/km shared across
  seats, peak/demand adjustment, PKR 20 service fee, PKR 50 on rides of
  PKR 1,000+).
- **AI Assistant** — answers from original rides only; greetings get a
  greeting, never an unsolicited ride suggestion. Uses Gemini when a key is
  set, otherwise a rule-based assistant.
- **Safety** — SOS alerts with emergency contacts, safety page, women-only
  rides, driver ratings and trust scores.
- **In-app booking for external rides** — booking stays in Hamsafar
  (`pending_driver_confirmation` → rider confirms → `confirmed`). The rider
  is never auto-redirected to an external site; the original listing opens
  in a new tab only on an explicit tap. Hamsafar charges no fee on external
  bookings — the rider pays the driver directly.

## Tech stack

Next.js 14 (App Router) + TypeScript · Supabase (Postgres + Auth + RLS) ·
Vercel · Leaflet/OpenStreetMap (maps) · Nominatim + OSRM (road distance).

## Project structure

```
app/            Pages: home, find, offer, login, onboarding, dashboard, safety, sos, recommendations
app/api/        rides, match, recommendations, fare, chat, profile, verify,
                bookings, bookings/external, sos, contacts, feedback
lib/            supabase, matching, fare, ai, sawarri, external-sources,
                original-rides, distance, validation, auth, rate-limit
lib/ml/         Trained recommendation classifier (logistic regression) + weights
supabase/       schema.sql + migrations (sos, feedback, external_booking_requests,
                verification_data)
```

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in your own values — never commit this file
npm run dev
```

Without Supabase variables the app runs on public-board data only (see
“Data modes”); with them it runs fully live.

## Environment variables

See `.env.example` for the full list. The important ones:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key — never expose to the browser |
| `EXTERNAL_RIDES_API_URL` / `EXTERNAL_RIDES_API_KEY` | Optional partner ride feeds |
| `ADMIN_VERIFY_KEY` | Required in live mode to approve verifications |
| `GEMINI_API_KEY` | Optional, for LLM chat answers |

## Data modes (honest by design)

- **Live mode** (Supabase env vars set): real auth, real profiles, real
  rides, real bookings, real verification submissions.
- **Original-data mode** (no Supabase vars): listings come from the public
  Sawarri board and any configured partner APIs. No demo filler is ever
  shown as a real ride.

## Verification — the listing rule

A rider is listed **only after submitting the complete verification
dataset**: name, phone, CNIC, date of birth, address, city, emergency
contact, plus licence + vehicle details for drivers, plus documents (CNIC
front/back, selfie; licence + vehicle registration for drivers).
Incomplete submissions are rejected with the exact missing list.

After submission the rider appears with a **“Verification pending”**
badge; the badge becomes **“Verified”** only after admin approval. A rider
who submitted nothing is never listed.

## Security and privacy

- Full CNIC is **never stored** — only a SHA-256 hash, the last 4 digits,
  and a masked display. Document files go to a **private** Supabase Storage
  bucket (`verification-documents`), never to a public URL.
- Row Level Security on all tables; Bearer-token auth + role checks on
  write APIs; verified-driver-only listings; rate limiting
  (60 reads / 20 writes / 30 chats per minute per IP); security headers;
  input validation and sanitisation; pagination capped at 50.
- **No secret or personal information belongs in this repo.** Keys live in
  `.env.local` (git-ignored) and in Vercel environment variables only.
  `.env.example` contains placeholders, never real values.
- Note: there is no public NADRA CNIC verification API, so verification
  here means an automated format check plus admin document approval.

## Deployment

Deployed on **Vercel** from this repo (Next.js auto-detected). After the
first deploy, set the Supabase environment variables in the Vercel project
settings and run the pending SQL migrations in `supabase/migrations/` on
the live Supabase project (in order: `sos.sql`, `feedback.sql`,
`external_booking_requests.sql`, `verification_data.sql`), then redeploy.

**Live URL:** https://hamsafar-sage.vercel.app/
