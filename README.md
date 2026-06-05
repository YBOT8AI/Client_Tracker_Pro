# 🎯 Client Tracker Pro

Track client purchases, referrals, and automated follow-up reminders.

## Features

- **Client Management** — Unique Client IDs, contact info, referral tracking
- **Purchase Recording** — Store name, amount, date, items
- **Referral Network** — Track who referred whom
- **Smart Analytics** — Purchase frequency, avg order value, last purchase date
- **Auto Follow-ups** — Reminders for clients inactive 30+ days

## Quick Start

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Wait for provisioning (~2 min)

### 2. Run Database Schema

In Supabase SQL Editor, run:
```sql
-- Copy contents of supabase/schema.sql
```

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — From Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — From Settings → API (keep secret!)

### 4. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

```bash
vercel
```

Add environment variables in Vercel dashboard.

## Next Steps

- Add client/purchase forms
- Build referral network visualization
- Email/SMS reminder integration
- CSV export for reports

---

**Built with:** Next.js 14, Supabase, Tailwind CSS
