## Concourse – Future DigitalOcean Enhancements

This document captures ideas for deepening Concourse's integration with the DigitalOcean ecosystem. It is a planning reference for post-hackathon work and future roadmap.

---

## 1. DigitalOcean Managed Database (PostgreSQL)

### 1.1 What would be stored there?

**Core tables**

- **`users` / `sessions`**
  - Identity for recurring travelers or anonymous session IDs.
  - Columns (illustrative):
    - `id`
    - `email` (nullable)
    - `created_at`
    - `last_seen_at`
    - `session_id`
    - `auth_provider` (optional)

- **`preferences`**
  - Today: preferences live in Supabase + in-memory context.
  - Future: store them in DO Managed PostgreSQL (possibly as the primary source of truth).
  - Columns:
    - `id`
    - `user_id` or `session_id`
    - `dietary text[]`
    - `cuisine text[]`
    - `price text[]`
    - `service text[]`
    - `meal text[]`
    - `updated_at`

- **`searches` / `itineraries`**
  - Every flight lookup becomes a row:
  - Columns:
    - `id`
    - `user_id` / `session_id`
    - `flight_number`
    - `departure_airport_iata`
    - `arrival_airport_iata`
    - `flight_date`
    - `mode` (`single` vs `multi_leg`)
    - `created_at`

- **`recommendation_events`**
  - What was shown vs what the user engaged with:
  - Columns:
    - `id`
    - `search_id`
    - `vendor_name`
    - `terminal`
    - `gate`
    - `level` (`green` | `yellow` | `red`)
    - `shown_at`
    - `clicked_at` (nullable)

- **`chat_logs`** (optional, anonymized)
  - High-value for understanding behavior and tuning agents.
  - Columns:
    - `id`
    - `user_id` / `session_id`
    - `role` (`user` | `assistant`)
    - `content`
    - `flight_context_json` (JSONB)
    - `created_at`

### 1.2 How this changes implementation

- **Backend changes**
  - Introduce a DO Managed PostgreSQL instance and a small data layer under something like `src/server/db`.
  - Use `pg` or Prisma to:
    - Persist preferences on `/api/preferences` POST.
    - Read preferences on `/api/preferences` GET.
    - Insert into `searches` on `/api/flight/lookup` (including mode and airport).
    - Insert into `recommendation_events` when a user clicks a restaurant (front-end event → API route → DB).
  - Optionally insert into `chat_logs` from `/api/chat` with a coarse-grained conversation snapshot.

- **Frontend changes**
  - API contracts (`/api/preferences`, `/api/recommendations`, `/api/chat`) remain stable.
  - Preferences and analytics gain persistence beyond the current session.

- **Story for write-ups**
  - “Flight searches, user preferences, and recommendation analytics are persisted in a DigitalOcean Managed PostgreSQL database.”
  - “We use these signals to continuously refine our airport vendor knowledge base and agent behavior.”

---

## 2. DigitalOcean Spaces for Static Assets

### 2.1 What to store in Spaces

- **Static visual assets**
  - Marketing hero images, background textures, and branding graphics.
  - Screenshots / diagrams used in the `How It Works` page.

- **Airport / terminal JSON snapshots**
  - Current: airport data lives in `src/data/airports/*.json`.
  - Future: keep the authoritative copies in Spaces and either:
    - Pull them at build time, or
    - Load them at runtime (with caching) for flexibility.

- **RAG documents / seed content**
  - PDFs or markdown docs describing terminals, vendor guides, and “Concourse Tips”.
  - These can be mirrored between Spaces and Gradient knowledge base ingestion.

### 2.2 Where these appear in the web app

- **Homepage and `How It Works`**
  - Hero background image and decorative illustrations loaded from Spaces URLs.
  - Inline images in `how-it-works` referencing Spaces-hosted assets.

- **Vendor imagery (later)**
  - Logos or small photos for selected vendors within `FoodRecommendationCard`, sourced from Spaces.

### 2.3 Implementation notes

- Configure a Spaces bucket + CDN and expose an environment variable like `NEXT_PUBLIC_SPACES_BASE_URL`.
- Centralize asset URLs in a small helper (e.g. `src/lib/assets.ts`), such as:
  - `HERO_BG = `${SPACES_BASE_URL}/hero-bg.png``
  - `HOW_IT_WORKS_DIAGRAM = `${SPACES_BASE_URL}/how-it-works/diagram.png``
- Replace `/public/...` paths or hardcoded URLs with references to this helper.

---

## 3. Trip Planner / Layover Planner (Future Feature)

### 3.1 Concept

- Add a **trip mode toggle** on the homepage:
  - `Trip mode: [ Single flight | Multi-leg / Layover ]`.
- In **single flight** mode:
  - Behavior matches today (origin airport focus).
- In **multi-leg / layover** mode:
  - Plan a “meal journey” across legs:
    - Example: lunch at origin, coffee on a short layover, dinner at the final hub.
  - Ensure each recommendation is time-safe given walk times and layover lengths.

### 3.2 Gradient Trip Planner agent + knowledge base

- **New agent: Trip Planner / Layover Agent**
  - Inputs:
    - List of flight segments (airports, terminals, boarding times).
    - User preferences (dietary, cuisine, budget, etc.).
  - Tools:
    - `get_flight_info` (already modeled for the Flight agent).
    - `get_food_recommendations` for each segment’s departure airport.
  - Knowledge base:
    - Airport-specific layover tips, expected transfer times, “what to do with 45 min vs 2 hours”.
    - Terminal-to-terminal transfer guidance where relevant.

- **Lead agent orchestration**
  - When the user is in multi-leg mode, the lead Concourse agent:
    - Delegates to the Trip Planner agent rather than the Food-only agent.
    - Receives back a structured plan (per-leg recommendations) and surfaces it in UI.

### 3.3 UI and API sketch

- **UI**
  - Add a toggle above the flight form:
    - Default: `Single flight (nonstop)`.
    - Alternate: `Connecting / layover (multi-leg)`.
  - Later, allow:
    - Additional flight number inputs, or
    - A free-form description passed to the Trip Planner agent (for v1 simplicity).

- **Backend**
  - Add `/api/trip-plan`:
    - Accepts the trip description and preferences.
    - Invokes the Trip Planner agent via Gradient.
    - Returns a per-segment plan:
      - Suggested vendor(s) for each airport, with timing and justification.

- **Story**
  - “Concourse doesn’t just help at a single gate; it can plan your entire food journey across a multi-leg itinerary.”

---

## 4. “I’m Feeling Lucky” Recommendation Mode

### 4.1 Concept

- Add a small call-to-action on the results page:
  - Button: **“I’m feeling lucky”**.
  - Behavior: pick one bold recommendation and pitch it strongly in Concourse’s voice.

### 4.2 Behavior and implementation ideas

- **Selection logic**
  - Use the existing recommendation list but:
    - Bias toward green/yellow options that satisfy preferences.
    - Add a bit of randomness so it does not always pick the same vendor.

- **Agent involvement**
  - Option 1: Front-end calls `/api/chat` with:
    - The current recommendations as context.
    - A system/user instruction: “Pick exactly one option and convince me.”
  - Option 2: Expose a dedicated Gradient tool that returns a single vendor based on:
    - Time constraints, preferences, and some exploration.

- **UI**
  - Place the button above or within `FoodRecommendations`.
  - Optionally highlight the “lucky” choice with a special badge (“Concourse’s pick”).

---

## 5. Containers & DigitalOcean App Platform Deployment

### 5.1 Where the app runs

- **Current state**
  - Local development via `npm run dev` on `localhost`.
- **With App Platform**
  - Production app runs on DigitalOcean:
    - Example: `https://concourse-app.ondigitalocean.app` (or custom domain).
  - Local still used for dev; live demo is DO-hosted.

### 5.2 Deployment options

- **Direct from GitHub (no Dockerfile required)**
  - Connect GitHub repo to App Platform.
  - App Platform auto-detects Next.js and:
    - Runs `next build`.
    - Serves the app with an appropriate runtime.
  - Configure environment variables on App Platform:
    - `DO_GRADIENT_API_KEY`
    - `AVIATIONSTACK_API_KEY` (if used)
    - `NEXT_PUBLIC_MAPBOX_TOKEN`
    - `DATABASE_URL` (DO Managed PostgreSQL)
    - `SPACES_ACCESS_KEY`, `SPACES_SECRET_KEY`, `SPACES_BUCKET`
    - `NEXT_PUBLIC_SPACES_BASE_URL`

- **Container-based via DigitalOcean Container Registry (DOCR)**
  - Build a Docker image in CI or locally:
    - Multi-stage build (Node 20) → `next build` → `next start`.
  - Push the image to DOCR.
  - App Platform service pulls from DOCR for deployments.
  - Useful if you want tighter control over runtime and dependencies.

### 5.3 Integration story

- End-state narrative:
  - **App Platform**: hosts the Next.js app and API routes.
  - **Gradient**: powers multi-agent orchestration and RAG (Flight agent, Food agent, Trip Planner agent).
  - **Managed PostgreSQL**: stores preferences, searches, analytics, and optional chat logs.
  - **Spaces**: serves static assets and possibly airport/vendor JSON.
  - **(Optionally) DOCR**: provides container images as the deployment artifact for App Platform.

---

## 6. Phased Plan

### Phase 1 – Data and Infrastructure

- Stand up a DigitalOcean Managed PostgreSQL instance.
- Move or mirror:
  - Preferences
  - Flight searches
  - Recommendation events
  - (Optional) Chat logs
- Introduce DigitalOcean Spaces:
  - Host hero/marketing imagery and `how-it-works` visuals.
  - Optionally host airport JSON as canonical data.

### Phase 2 – New AI Features

- Implement the **Trip Planner / Layover agent**:
  - New Gradient agent + knowledge base.
  - `/api/trip-plan` endpoint and a UI toggle for multi-leg mode.
- Add **“I’m feeling lucky”**:
  - Button in the results view.
  - Either chat-driven or dedicated tool to select one option and pitch it.

### Phase 3 – Deployment & Production Readiness

- Connect the GitHub repo to **DigitalOcean App Platform** or deploy via DOCR.
- Configure environment variables and secrets in App Platform.
- Add monitoring and alerts for:
  - API error rates (`/api/flight/lookup`, `/api/recommendations`, `/api/chat`, `/api/trip-plan`).
  - Latency and failure patterns.
- Update docs and hackathon submission to emphasize:
  - The “all-on-DigitalOcean” architecture.
  - Multi-agent Gradient usage.
  - Managed PostgreSQL + Spaces + App Platform working together.

---

## 7. Ordered Task List (Easiest → Hardest)

This is a rough implementation order, starting with changes that are easiest and least invasive.

1. **Add “I’m feeling lucky” button**
   - UI button above `FoodRecommendations` that calls `/api/chat` (or a new endpoint) with the current recommendations and asks the agent to pick one and pitch it.
   - Mostly front-end work plus a small prompt/handler change.

2. **Wire DigitalOcean Spaces for a single hero image**
   - Create a Spaces bucket and upload one hero/marketing image.
   - Expose `NEXT_PUBLIC_SPACES_BASE_URL` and swap the homepage hero background to use the Spaces URL.

3. **Use Spaces for additional imagery**
   - Move `how-it-works` diagrams and optional vendor logos into Spaces.
   - Centralize asset URLs in a helper module.

4. **Deploy current app to DigitalOcean App Platform (from GitHub)**
   - Connect the GitHub repo to App Platform.
   - Configure build/start commands and environment variables.
   - Use the DO-hosted URL for demos instead of localhost.

5. **Introduce a basic analytics schema in Managed PostgreSQL**
   - Stand up a DO Managed PostgreSQL instance.
   - Add simple tables for `searches` and `recommendation_events`.
   - On key API routes, insert rows keyed by the existing session ID (no auth required).

6. **Move preferences persistence into Managed PostgreSQL**
   - Store and read preference filters from Managed PG via `/api/preferences`.
   - Optionally keep Supabase as a secondary store or phase it out for preferences.

7. **Host airport JSON in Spaces and load from there**
   - Move `src/data/airports/*.json` into Spaces.
   - Add a small data access layer that fetches and caches these JSON files.
   - Update recommendations and map code to use this layer instead of local imports.

8. **Containerize and deploy via DigitalOcean Container Registry**
   - Add a Dockerfile and CI pipeline to build and push images to DOCR.
   - Point App Platform at the container image instead of GitHub source.

9. **Add Trip Planner / Layover toggle and `/api/trip-plan`**
   - UI: toggle between single flight and multi-leg/layover mode.
   - Backend: implement `/api/trip-plan` that talks to a Gradient agent and returns a multi-leg plan.
   - UI: render per-segment meal recommendations.

10. **Build a dedicated Trip Planner agent + knowledge base in Gradient**
    - Create a new Gradient agent specifically for multi-leg planning.
    - Give it tools for flight info and food recommendations.
    - Ingest a layover-focused knowledge base and refine prompts for realistic multi-airport journeys.

11. **Experiment with a GPU Droplet for on-droplet inference**
    - Spin up a DigitalOcean GPU Droplet and deploy a small inference server (e.g. a compact LLM or reranker).
    - Integrate it as an additional tool or scoring step for recommendations or trip plans (e.g. re-ranking options or generating richer explanations).
    - Compare latency/cost tradeoffs vs using only Gradient-hosted models and document when a GPU Droplet is beneficial.

