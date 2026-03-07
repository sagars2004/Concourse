# Concourse

**Your AI-powered airport food concierge.** Never miss your flight chasing food again. Enter your flight number and get time-aware, gate-smart food recommendations with a witty AI guide.

Built for the **DigitalOcean Gradient AI Hackathon 2026**.

## Features

- **Flight lookup** — Enter flight number (e.g. AA 203); get airline, terminal, gate, and boarding time (AviationStack API or stub).
- **Time-aware recommendations** — Food options ranked by walk time with green/yellow/red confidence.
- **Dietary preferences** — Filter by vegetarian, vegan, gluten-free, halal, kosher (stored in Supabase).
- **Terminal map** — Mapbox GL map with gate and vendor markers (when token is set).
- **Chat with Concourse** — AI persona powered by DigitalOcean Gradient (when API key is set).
- **Gate change alerts** — Polling + demo “Simulate gate change” with re-routed recommendations and persona alert.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS, Shadcn-style UI
- **APIs:** Next.js API routes, AviationStack (flight data), Supabase (preferences)
- **AI:** DigitalOcean Gradient (chat + persona)
- **Map:** Mapbox GL JS

## Getting Started

### 1. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
cp .env.example .env.local
```

| Variable | Phase | Description |
|----------|--------|-------------|
| `AVIATIONSTACK_API_KEY` | 2 | [aviationstack.com](https://aviationstack.com/signup/free) — flight lookup |
| `NEXT_PUBLIC_SUPABASE_URL` | 3 | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 3 | Supabase service role key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | 5 | [Mapbox](https://account.mapbox.com/) — terminal map |
| `DO_GRADIENT_API_KEY` | 4 | DigitalOcean Gradient — AI chat |

Without these, the app still runs with stub/mock data.

### 3. Supabase (optional)

To persist dietary preferences:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of `supabase/schema.sql`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

## Deploy on DigitalOcean App Platform

1. Push the repo to GitHub.
2. In [DigitalOcean](https://cloud.digitalocean.com/), go to **Apps** → **Create App** → choose the repo.
3. Configure as a **Web Service**; build command: `npm run build`; run command: `npm start`.
4. Add all environment variables from `.env.example` in the App’s **Settings** → **App-Level Environment Variables**.
5. Deploy. The app will be available at the provided URL.

## Demo flow

1. Enter a flight number (e.g. `AA 203`) and click Search.
2. Confirm flight details; edit gate if needed.
3. Set dietary preferences; recommendations update.
4. Use “Simulate gate change (demo)” in the flight card to trigger a gate change and see the alert + updated recommendations and chat message.
5. Ask Concourse questions in the chat (stub or Gradient, depending on `DO_GRADIENT_API_KEY`).

## License

See repository license.
