# Concourse — Next Steps Roadmap

This doc outlines suggested next steps after the current prototype (flight lookup, manual confirmation fields, recommendations, dietary preferences, chat). Order is flexible; pick what matters most for your demo or hackathon.

---

## Done (current prototype)

- Flight lookup (AviationStack, optional airport + date)
- **Manual confirmation** — Gate, terminal, and “minutes until boarding” are editable so users can correct API data or boarding pass info
- Food recommendations (seeded airport data, dietary filter)
- Dietary preferences (UI + API; Supabase optional)
- Chat (Gradient serverless inference or stub)
- Gate change simulation (demo trigger)
- Basic terminal map (Mapbox GL JS) — requires `NEXT_PUBLIC_MAPBOX_TOKEN`

---

## 1. DigitalOcean Gradient — Agent creation (optional)

**Goal:** Move from “serverless inference + system prompt” to the full PRD: a **Concourse lead agent** that orchestrates sub-agents (Flight, Food/RAG) and uses a knowledge base.

**Steps:**

1. **Gradient in the control panel**  
   Log in at [cloud.digitalocean.com](https://cloud.digitalocean.com) → **Agent Platform** (or **Gradient AI**).

2. **Create a knowledge base (RAG)**  
   - Create → Knowledge Bases → name (e.g. “Concourse Airports”).  
   - Data source: upload airport/vendor data (e.g. from `src/data/airports/`) or point at hosted docs.  
   - Finish indexing.

3. **Create the Concourse agent**  
   - Create → Agent.  
   - Configure the **lead agent**: system prompt = Concourse persona (witty, time-aware, opinionated).  
   - Add **sub-agents** (or tools):  
     - **Flight sub-agent**: calls your existing `/api/flight/lookup` (or AviationStack) and returns gate, terminal, boarding time, delay.  
     - **Food sub-agent**: queries the RAG knowledge base by terminal + dietary prefs, returns ranked options with walk times.  
   - Attach the knowledge base to the Food sub-agent (or to the lead).  
   - Use **function calling** so the lead agent invokes flight lookup and food search with user context.

4. **Wire the app to the agent**  
   - In Gradient, get the agent’s **API endpoint** and **API key**.  
   - In the app, point `/api/chat` (or a new route) at the agent endpoint instead of raw serverless inference.  
   - Pass conversation history + current flight/terminal/gate/minutes so the agent can answer in context.

**Ref:** `docs/GRADIENT_SETUP.md` for Model Access Key vs full agent path.

---

## 2. Mapbox GL JS — Token and map polish

**Goal:** Terminal map works in production and is clear for the demo.

**Steps:**

1. **Get a Mapbox token**  
   Sign up at [mapbox.com](https://www.mapbox.com), create an access token (public, with the scopes you need).  
   Add to `.env`:  
   `NEXT_PUBLIC_MAPBOX_TOKEN=pk.…`

2. **Use overrides on the map**  
   In `terminal-map.tsx`, use **gate override** and **terminal override** from context (and airport when available) so the map reflects user-corrected gate/terminal.

3. **Optional:** Add a simple walking route (e.g. gate → one recommended vendor) with Mapbox Directions or a polyline from `map-coordinates` so “walk time” feels concrete.

---

## 3. Supabase — Preferences and session

**Goal:** Dietary preferences (and optionally session) persist across refreshes.

**Steps:**

1. **Supabase project**  
   Create a project at [supabase.com](https://supabase.com), get project URL and anon key.

2. **Env**  
   `NEXT_PUBLIC_SUPABASE_URL=…` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=…` (or server-side keys if you prefer).

3. **Schema**  
   Table keyed by session id (e.g. `session_id`, `dietary_preferences` JSON/text array).  
   Match what `/api/preferences` expects (see existing route).

4. **Wire-up**  
   Ensure the preferences API and the dietary UI read/write Supabase so that after “Set Preferences”, a refresh still shows the same choices.

---

## 4. Gate change — Live polling (optional)

**Goal:** In addition to “Simulate gate change”, optionally poll AviationStack (or your backend) for real gate updates.

**Steps:**

1. **Backend**  
   In `/api/gate/status`, when not in “simulate” mode, call AviationStack (or a cached flight record) for the current flight and compare gate to the last known gate.

2. **Frontend**  
   Keep the existing 30s (or similar) polling; when the API returns `changed: true` and a new gate, run the same “gate change” flow (alert + update recommendations).

3. **Rate limits**  
   Respect AviationStack free-tier limits (e.g. one flight lookup per polling cycle, rely on in-memory/cache for “previous gate”).

---

## 5. Deployment — DigitalOcean App Platform

**Goal:** Public URL for demo and submission.

**Steps:**

1. **Repo**  
   Push to GitHub (public repo, OSI-approved license if required).

2. **App Platform**  
   In DigitalOcean, Create → App → choose GitHub repo, branch.  
   Configure as Node/Next.js (build: `npm run build`, run: `npm start` or the Next.js start command).

3. **Env**  
   Add env vars in the App Platform UI:  
   `AVIATIONSTACK_API_KEY`, `DO_GRADIENT_API_KEY` (or Gradient agent key), `NEXT_PUBLIC_MAPBOX_TOKEN`, Supabase vars if used.  
   No secrets in the repo.

4. **Hackathon checklist**  
   - Demo video (full flow: flight → confirm/edit gate/terminal/minutes → preferences → recommendations → map → chat → gate change).  
   - README with setup and how to get API keys.  
   - Submission form: repo link, video link, DO Gradient usage callout.

---

## 6. Nice-to-haves

- **Concourse persona in the first message**  
  Use the same tone and “X minutes” from overrides in the post–flight-load message.

- **“Minutes until boarding” from a time picker**  
  Optional: let user enter boarding time (e.g. 7:05 AM) and derive minutes until boarding from current time for display and for recommendations.

- **Error and empty states**  
  Clear messages when flight not found, API limit hit, or no recommendations (e.g. “No options match your filters; try relaxing dietary preferences”).

- **Accessibility**  
  Labels, focus order, and keyboard support for the new manual confirmation fields (gate, terminal, minutes).

---

*Concourse PRD and `docs/GRADIENT_SETUP.md` are the source of truth for architecture and Gradient options.*
