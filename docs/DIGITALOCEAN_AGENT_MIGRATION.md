# Migrating Concourse to DigitalOcean Gradient Agent Orchestration

This guide walks you through moving from **serverless inference** (single model + system prompt) to **agent orchestration** on DigitalOcean Gradient: a lead Concourse agent that can use knowledge bases (RAG), subagents for flight and food data, and function calling to gather and display data in the web app.

---

## What You Get

| Current (serverless) | After migration (agents) |
|----------------------|---------------------------|
| One model call with a system prompt | Lead **Concourse** agent with persona |
| No RAG | **Knowledge base** with airport/terminal/vendor data |
| Chat only | **Subagents** (e.g. Flight, Food) for structured tasks |
| No function calling | Agent can **call tools** (e.g. flight lookup, recommendations) |

The web app stays the same; you add env vars and optionally pass context (flight, preferences) into the chat so the agent can use them.

---

## 1. Prerequisites

- DigitalOcean account with [Gradient AI / Agent Platform](https://cloud.digitalocean.com) enabled.
- Hackathon or paid credits if required for your region.
- Your Concourse repo (flight lookup, recommendations, and chat already implemented).

---

## 2. Create a Knowledge Base (RAG)

Used by the Food agent (or lead agent) to answer questions about terminals and vendors.

1. In the control panel: **Agent Platform** → **Knowledge Bases** → **Create**.
2. **Name:** e.g. `Concourse Airports`.
3. **Data source:**
   - **File upload:** Export your airport data (e.g. from `src/data/airports/` — JSON or markdown) and upload.
   - Or **URL:** If you host the content somewhere, add the URL for crawling.
4. **Index:** Create or select an OpenSearch (or configured) index; pick an **embedding model**.
5. Finish creation and wait for **indexing** to complete.

---

## 3. Create Subagents (Optional but Recommended)

You can start with one lead agent that has a knowledge base and tools, or add dedicated subagents and route to them.

### Option A: One lead agent with tools

- Create a single **Concourse** agent.
- Give it the Concourse persona instructions and attach the knowledge base.
- Add **tools/functions** (e.g. `get_flight_info`, `get_food_recommendations`) that call your existing Next.js API routes (e.g. `POST /api/flight/lookup`, `POST /api/recommendations`) so the agent can “gather data” via function calls.

### Option B: Lead agent + subagents (orchestration)

1. **Flight subagent**
   - Create agent, name e.g. `Concourse Flight`.
   - Instructions: “You are a flight data assistant. When given a flight number and optional airport/date, return structured flight info: airline, terminal, gate, boarding time, status. Use the provided tool to call the flight lookup API.”
   - Add a **function/tool** that calls your `POST /api/flight/lookup` (or a serverless function that does the same).

2. **Food subagent**
   - Create agent, name e.g. `Concourse Food`.
   - Attach the **Concourse Airports** knowledge base.
   - Instructions: “You are a food recommendation assistant. Use the knowledge base and the provided tool to get recommendations by terminal, gate, dietary preferences, and minutes until boarding. Return concise, opinionated suggestions in Concourse’s voice.”

3. **Lead Concourse agent**
   - Create agent, name e.g. `Concourse`.
   - Instructions: Use the Concourse persona (see `src/lib/concourse-persona.ts`). Say that you have access to flight and food assistants; when the user asks about their flight or food, route to the appropriate subagent and then synthesize the answer in your voice.
   - In the control panel, add **child agents** (Flight, Food) and configure when to route to them (e.g. by intent or tool use).

Routing and child-agent setup are done in the UI or via API: [Route to multiple agents](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/route-agents).

---

## 4. Get the Lead Agent Endpoint and Access Key

1. Open the **Concourse** (lead) agent in the control panel.
2. **Overview** tab → **ENDPOINT** section: copy the **URL** (e.g. `https://xxxx.agents.do-ai.run`). Do **not** add a path; the app will add `/api/v1/chat/completions`.
3. **Settings** tab → **Endpoint Access Keys** → **Create Key** → name it (e.g. `Concourse production`) → **Create** and **copy the secret**. Store it securely; it won’t be shown again.

---

## 5. Wire the Web App to the Agent

The app already supports agent mode. When these env vars are set, the chat API uses the agent endpoint instead of serverless inference.

Add to `.env` (or your deployment env):

```bash
# Agent orchestration (optional; if set, chat uses the agent instead of serverless inference)
GRADIENT_AGENT_ENDPOINT=https://your-agent-id.agents.do-ai.run
GRADIENT_AGENT_ACCESS_KEY=your_agent_access_key_here
```

- **No trailing slash** on `GRADIENT_AGENT_ENDPOINT`.
- Keep `DO_GRADIENT_API_KEY` if you still want serverless as fallback for other features, or when the agent is not set.

**Behavior:**

- `src/lib/gradient.ts`: If `GRADIENT_AGENT_ENDPOINT` and `GRADIENT_AGENT_ACCESS_KEY` are set, `concourseChat()` calls the agent at `POST {endpoint}/api/v1/chat/completions` with the same messages and system prompt. Otherwise it uses the existing serverless client.
- `src/app/api/chat/route.ts`: No code change needed; it already uses `concourseChat()`.

To pass **current flight and preferences** into the agent (so it can use RAG or tools with context), you can extend the chat request body and prepend a context message (e.g. “Current context: flight UA2485, gate E7, terminal E, 45 min until boarding, dietary: vegetarian”) to the `messages` array in the route before calling `concourseChat()`.

---

## 6. Deploy to DigitalOcean App Platform

1. Push your repo to GitHub.
2. In DigitalOcean: **Apps** → **Create App** → choose the repo and branch.
3. Configure as a **Web Service**, build: `npm run build`, run: `npm start` (or your Next.js start command).
4. **Environment variables:** Add all required vars:
   - `AVIATIONSTACK_API_KEY`
   - `DO_GRADIENT_API_KEY` and/or `GRADIENT_AGENT_ENDPOINT` + `GRADIENT_AGENT_ACCESS_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - Any Supabase or other keys you use.
5. Deploy. Your app will use agent orchestration in production when the agent env vars are set.

---

## 7. Verify

- Open the app and run a flight lookup, then open chat.
- Ask something that should use RAG or a subagent (e.g. “What food is near my gate?” or “What’s my flight status?”). You should get answers that use your knowledge base or tools.
- In the Gradient control panel, use **Observability** / **Traces** to see agent and subagent calls and tool usage.

---

## 8. References

- [Use agents in your applications](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/use-agents) — endpoint URL, access key, `POST /api/v1/chat/completions`.
- [Route to multiple agents](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/route-agents) — parent/child agents and routing.
- [Create agents](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/create-agents) — instructions, model, knowledge base.
- **This repo:** `docs/GRADIENT_SETUP.md` (Model Access Key vs agent), `src/lib/gradient.ts` (agent vs serverless), `src/lib/concourse-persona.ts` (persona prompt).

---

*Concourse — DigitalOcean Gradient Agent Migration*
