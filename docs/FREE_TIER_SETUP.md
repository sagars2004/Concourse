# Free Tier Setup — No DigitalOcean Gradient Required

Use these steps to get **real flight data**, **saved preferences**, and **terminal map** working with free APIs. The chat will use built-in stub responses until you add a Gradient key.

---

## 1. AviationStack — Real flight info (free)

Displays real airline, terminal, gate, and status when you enter a flight number.

### Get your key

1. Go to **[aviationstack.com/signup/free](https://aviationstack.com/signup/free)**.
2. Sign up (email + password).
3. In the dashboard, copy your **API Access Key** (sometimes under “Dashboard” or “API Key”).

### Add to `.env`

```bash
AVIATIONSTACK_API_KEY=your_key_here
```

### Limits

- **100 requests/month** on the free plan.
- The app caches each flight for 5 minutes so repeated lookups for the same flight don’t use extra requests.
- If a flight isn’t in their system (e.g. future or very old), you’ll see “Flight not found” and can still use the app with the **Edit** gate option to enter details manually.

### Test

1. Restart dev server: `npm run dev`.
2. Enter a real flight number (e.g. a known active or recent flight like `AA 100` or your next flight).
3. You should see real airline, terminal, gate (if available), and status. If not found, you’ll get a clear message and can edit the gate.

---

## 2. Supabase — Save dietary preferences (free)

Keeps vegetarian, vegan, gluten-free, etc. across refreshes and devices (per session).

### Setup

1. Go to **[supabase.com](https://supabase.com)** and create a free account and project.
2. In the project: **Settings** → **API**.
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (under “Project API keys”) → `SUPABASE_SERVICE_ROLE_KEY`
4. In the SQL Editor, run the contents of **`supabase/schema.sql`** in this repo (creates `sessions` and `preferences` tables).

### Add to `.env`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Without these, preferences still work but are stored in memory only (lost on refresh).

---

## 3. Mapbox — Terminal map (free)

Shows an interactive map with gate and food vendor markers when you have a flight result.

### Get your token

1. Go to **[account.mapbox.com](https://account.mapbox.com/)** and sign up.
2. Open **Access tokens**.
3. Copy your **Default public token** (or create a new public token).

### Add to `.env`

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

Without this, you’ll see a “Mapbox — add token to enable” style placeholder instead of the map.

---

## Summary: what works without Gradient

| Feature              | Without any keys     | With free keys only                          |
|----------------------|----------------------|---------------------------------------------|
| Flight lookup        | Stub (fake AA 203)   | **Real data** (AviationStack)               |
| Dietary preferences  | In-memory (lost on refresh) | **Saved** (Supabase)                 |
| Food recommendations | From app data        | Same (RAG/airport data in app)               |
| Terminal map         | Placeholder          | **Interactive map** (Mapbox)                |
| Chat with Concourse  | Stub replies         | Stub replies (add `DO_GRADIENT_API_KEY` later for AI) |

You can add **only** `AVIATIONSTACK_API_KEY` and get real flight info; add Supabase and Mapbox when you want persistence and the map. No DigitalOcean or Gradient setup is required for any of this.
