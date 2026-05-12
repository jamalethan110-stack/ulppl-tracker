# ULPPL Tracker

Your personal full-stack workout, weight, and food tracker — Next.js + Supabase, deployable to Vercel in about 10 minutes. Works on iPhone, laptop, and any device with a browser. All data lives in your own Supabase database; you own everything.

## Features

- **Workout tracker** — your 5-day Upper / Lower / Push / Pull / Legs split with per-exercise check-off, abs section, info & weekly volume chart
- **Weight log** — log weigh-ins, see a trend chart, track change over time (lb or kg)
- **Food log** — manual macros entry (calories, protein, carbs, fat) + a personal favorites list for one-tap logging of common foods
- **Cross-device sync** — sign in with email on any device, data follows you
- **Mobile-first dark UI** with safe-area handling for iPhone

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (auth + Postgres)
- Recharts (weight chart)
- Tailwind (configured, but most styling uses the existing inline-style system to preserve your design)

## 1. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project. Pick a strong DB password and remember the region.
2. Wait ~2 minutes for the project to provision.
3. In the project dashboard, open **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and click **Run**. This creates all tables and Row Level Security policies so each user can only see their own data.
4. Open **Project Settings → API**. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon / public** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. (Optional) Open **Authentication → Providers → Email**. If you want to skip email confirmation for testing, disable "Confirm email."
6. Open **Authentication → URL Configuration**. Add your future Vercel URL (e.g. `https://your-app.vercel.app`) to "Site URL" and to "Redirect URLs" → add `https://your-app.vercel.app/auth/callback`. You can update these after you deploy.

## 2. Run locally

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with any email + password, then start logging.

## 3. Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Wait ~1 minute.
5. Once live, update Supabase's **Site URL** and **Redirect URLs** (step 6 above) to use your real Vercel domain.

## 4. Use it from your iPhone

- Open the Vercel URL in Safari.
- Tap the share button → **Add to Home Screen**. The app launches full-screen, looks like a native app, and stays signed in.

## Project structure

```
app/
  layout.tsx           Root layout, bottom nav, font import
  globals.css          Dark theme + shared component classes
  page.tsx             Dashboard
  workout/page.tsx     Workout tracker (today's split)
  weight/page.tsx      Weight log + chart
  food/page.tsx        Food log + favorites
  login/page.tsx       Email/password auth
  auth/callback/       Supabase auth callback
components/
  WorkoutTracker.tsx   Ported from your original .tsx, now DB-backed
  WeightTracker.tsx
  FoodTracker.tsx
  Dashboard.tsx
  BottomNav.tsx
lib/
  supabase/client.ts   Browser Supabase client
  supabase/server.ts   Server Supabase client (cookies)
  types.ts             Shared TypeScript types
  workoutData.ts       Your ULPPL split definition + helpers
middleware.ts          Auth gate — redirects to /login when needed
supabase/schema.sql    Run this once in the Supabase SQL editor
```

## Customizing the split

Edit `lib/workoutData.ts`. Each day has:
- `label`, `sublabel`, `accent`, `note`, `tip`, `cardio`
- `exercises[]`: `{ name, sets, reps, focus }`
- `abs[]` (or `null` for no abs that day)

The weekly volume chart at the bottom of each day's Info tab is in `weeklyVolume` — update set counts there to match if you change the split.

## What's not included (yet)

- Per-set weight + rep logging (current version checks off whole exercises). Easy to add later — add a `workout_sets` table and per-set inputs.
- Food barcode scanning / USDA database. The current design assumes you build a personal favorites list, which is what most lifters actually want.
- Push notifications / reminders.

If you want any of these added later, just say so and the schema + UI can be extended without breaking existing data.

## Troubleshooting

- **"Failed to fetch" / no data showing**: check that env vars are set in Vercel and that you ran `schema.sql`.
- **Stuck at login after signup**: check Supabase → Authentication → Users. If your user shows "Waiting for verification", either click the link in your email or disable email confirmation in Supabase settings.
- **Data not syncing between devices**: make sure you're signed in with the same account on both devices (top-right of the dashboard shows your email).
