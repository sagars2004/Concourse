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
   - **File upload:** Upload the full airport food dataset: **`docs/knowledge-base/concourse-airports-jfk-lga-ewr-rdu.json`**. This file contains a complete list of food spots and vendors for JFK, LGA, EWR, and RDU (terminals, zones, dietary tags, opinions, tips). See `docs/knowledge-base/README.md` for details.
   - Or **URL:** If you host that JSON (or a rendered version) somewhere, add the URL for crawling.
4. **Index:** Create or select an OpenSearch (or configured) index; pick an **embedding model**.
5. Finish creation and wait for **indexing** to complete.

---

## 3. Create Subagents (Optional but Recommended)

You can start with one lead agent that has a knowledge base and tools, or add dedicated subagents and route to them.

### Option A: One lead agent with tools

- Create a single **Concourse** agent.
- Give it the Concourse persona instructions and attach the knowledge base.
- Add **tools/functions** (e.g. `get_flight_info`, `get_food_recommendations`) that call your existing Next.js API routes (e.g. `POST /api/flight/lookup`, `POST /api/recommendations`) so the agent can "gather data" via function calls.

### Option B: Lead agent + subagents (orchestration)

Create **three agents** in this order: Flight subagent, Food subagent, then the lead Concourse agent. Add **function routes** only after each agent exists (see **3c. Adding tools**). Tools must be **DigitalOcean Functions** (web functions); each function can call your Next.js API (e.g. `POST https://your-app.ondigitalocean.app/api/flight/lookup`) and return the JSON body.

---

#### 3.1 Flight subagent (Concourse Flight)

**Purpose:** Returns structured flight info (airline, terminal, gate, boarding time, status) when the user asks about a flight. Uses one tool that calls the app's flight lookup API.

**Create the agent**

1. In the control panel: **Agent Platform** → **Agents** → **Create Agent**.
2. **Name:** `Concourse Flight` (or similar).
3. **Model:** Prefer **Meta Llama** (e.g. `llama3.3-70b-instruct` or `llama3-8b-instruct`). Avoid Mistral NeMo for subagents — it can return 400 in agent routing (see [5c. Troubleshooting](#5c-troubleshooting)).
4. **Knowledge base:** None (leave empty).
5. **Instructions:** Paste the following (edit if you use different tool names):

```text
You are the Concourse Flight assistant. Your only job is to look up flight information when given a flight number (and optionally departure airport and date), then return a short, factual summary.

Rules:
- When the user provides a flight number (e.g. "AA 100", "DL 1234"), call the get_flight_info tool with that number.
- If the user also mentions an airport (e.g. "from JFK") or a date (e.g. "tomorrow", "March 8"), pass departureAirportIata (IATA code like JFK, LGA, EWR) and/or flightDate (YYYY-MM-DD) to the tool.
- Always pass flightNumber as a string; normalize it (e.g. "AA100", "DL1234") if needed.
- After you receive the tool result, respond with a brief summary: airline, departure airport, terminal, gate, boarding time, and status (on time / delayed / cancelled). Do not invent data; only use what the tool returns.
- If the tool returns an error or no flight, say so clearly and suggest the user check the flight number or try again.
- Do not answer questions about food, restaurants, or recommendations — only flight lookup.
```

6. Save the agent. Then open it → **Resources** → **Add function route** and add the tool (see **Tool: get_flight_info** below).

**Tool: get_flight_info**

- **Function:** A DigitalOcean web function that forwards to your app's flight lookup API.
- **Input schema (request body your function sends to the app):**
  - `flightNumber` (string, required) — e.g. `"AA100"`, `"DL1234"`.
  - `flightDate` (string, optional) — `YYYY-MM-DD`.
  - `departureAirportIata` (string, optional) — e.g. `"JFK"`, `"LGA"`.
- **App API:** `POST {CONCOURSE_APP_URL}/api/flight/lookup`  
  Body: `{ "flightNumber": "...", "flightDate": "...", "departureAirportIata": "..." }`  
  Your DO function should call this and return the response JSON (or a subset) as the tool result.
- **Output (what the agent sees):** The app returns a `FlightData`-shaped object (see above). On error: `{ "error": "message" }` with HTTP 4xx/5xx.

**Using a local app (localhost):** DO Functions run in the cloud and cannot reach your machine's `localhost`. Expose your app with a tunnel, then point the DO function at that URL. Options: **ngrok** (below), [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) (`cloudflared tunnel --url http://localhost:3000`), or **localtunnel** (`npx localtunnel --port 3000`). For production, deploy the app and set **CONCOURSE_APP_URL** to the deployed app URL.

**Setting up ngrok (step-by-step)**

1. **Install ngrok**
   - **macOS (Homebrew):** `brew install ngrok`
   - **Or:** Download from [ngrok.com/download](https://ngrok.com/download) and add the binary to your PATH.

2. **Create a free account and add your authtoken**
   - Sign up at [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup).
   - In the dashboard go to **Your Authtoken** and copy the token.
   - Run once: `ngrok config add-authtoken YOUR_TOKEN`

3. **Start your Concourse app** (e.g. in the project root):
   ```bash
   npm run dev
   ```
   Your app will be on `http://localhost:3000` (or the port Next.js shows).

4. **Start the tunnel** in a second terminal:
   ```bash
   ngrok http 3000
   ```
   (Use the port your app actually uses if different, e.g. `ngrok http 3001`.)

5. **Copy the public URL** from the ngrok terminal. It looks like:
   ```
   Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
   ```
   Use the **https** URL (e.g. `https://abc123.ngrok-free.app`) — no trailing slash.

6. **Set CONCOURSE_APP_URL** in your DigitalOcean function (or namespace) environment to that URL. The DO function will call your local app through the tunnel.

7. **While testing:** Keep both the app and `ngrok http 3000` running. If you stop and restart ngrok, the free URL usually changes — update **CONCOURSE_APP_URL** in DO with the new URL.

**Example DO Function (Node.js) — replace the default `main` with this:**

The function takes `args` and returns `{ "body": ... }`. Use the **CONCOURSE_APP_URL** environment variable (tunnel URL for local dev, or deployed app URL for production).

```javascript
const https = require('https');
const http = require('http');

function main(args) {
  const appUrl = process.env.CONCOURSE_APP_URL;
  if (!appUrl) {
    return { body: { error: 'CONCOURSE_APP_URL is not set. Use a tunnel URL (e.g. ngrok) for local dev or your deployed app URL.' } };
  }
  const flightNumber = args.flightNumber || args.flight_number;
  if (!flightNumber) {
    return { body: { error: 'flightNumber is required' } };
  }
  const body = JSON.stringify({
    flightNumber: String(flightNumber).trim(),
    flightDate: args.flightDate || args.flight_date || undefined,
    departureAirportIata: args.departureAirportIata || args.departure_airport_iata || undefined,
  });

  const url = new URL(appUrl);
  const path = (url.pathname.replace(/\/$/, '') || '') + '/api/flight/lookup';
  const isHttps = url.protocol === 'https:';
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const request = isHttps ? https.request.bind(https) : http.request.bind(http);
  return new Promise((resolve) => {
    const req = request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ body: json });
        } catch (e) {
          resolve({ body: { error: 'Invalid response from flight API' } });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ body: { error: String(err.message) } });
    });
    req.write(body);
    req.end();
  });
}
```

- **Where to set the app URL:** If the function UI only has a "test parameter" (JSON) and no environment variables:
  1. **Hardcode in the function (simplest):** In the function code, replace the first line inside `main` with your URL, e.g.  
     `const appUrl = 'https://YOUR-SUBDOMAIN.ngrok-free.app';`  
     Use your actual ngrok (or app) URL, no trailing slash. When ngrok gives you a new URL, edit the function and update this line.
  2. **Namespace settings:** In the DO dashboard go to **Functions** → select your **namespace** → look for **Settings** or **Environment** and add a variable there; it may be available as `process.env.CONCOURSE_APP_URL` in the function.
- **Hardcoded example** — use this inside `main` if you're not using env vars:
  ```javascript
  const appUrl = process.env.CONCOURSE_APP_URL || 'https://YOUR-NGROK-URL.ngrok-free.app'; // replace YOUR-NGROK-URL with your ngrok subdomain
  ```
  Then you can leave the rest of the function as-is
- The agent may send camelCase or snake_case; the example supports both. The response must be `{ body: <object> }` so the agent receives the flight data (or error) as the tool result.

**Routing from lead:** The lead agent will route to this subagent when the user asks about "flight status", "my flight", "gate", "boarding time", "flight number", etc.

---

#### 3.2 Food subagent (Concourse Food)

**Purpose:** Answers questions about food near the user's gate/terminal and returns recommendations. Uses the Concourse Airports knowledge base (RAG) plus one tool that calls the app's recommendations API.

**Create the agent**

1. **Agent Platform** → **Agents** → **Create Agent**.
2. **Name:** `Concourse Food`.
3. **Model:** Pick a model that works well with RAG (e.g. same as lead).
4. **Knowledge base:** Attach **Concourse Airports** (the one you created from `docs/knowledge-base/concourse-airports-jfk-lga-ewr-rdu.json`). Ensure indexing is complete.
5. **Instructions:** Paste the following:

```text
You are the Concourse Food assistant. You help travelers find food and drinks near their gate. You have:
1. A knowledge base of airport terminals, zones, and vendors (JFK, LGA, EWR, RDU) with names, cuisines, dietary tags, walk times, and opinions.
2. A tool get_food_recommendations that returns personalized recommendations for a terminal/gate and optional dietary/cuisine/price preferences.

Rules:
- When the user asks for food suggestions, recommendations, or "what can I eat near my gate", call get_food_recommendations with the context you have: terminal (e.g. "Terminal 4", "Terminal B"), departureAirportIata (e.g. "JFK"), gate if known, minutesUntilBoarding (number, default 40), and preferenceFilters (dietary, cuisine, price, service, meal arrays) if the user mentioned preferences.
- Use the knowledge base to answer general questions about a terminal (e.g. "what's in Terminal 4?", "any vegetarian options at JFK?") and to add color to the tool results (e.g. opinions, tips, walk times).
- Respond in Concourse's voice: friendly, opinionated, time-aware. Never recommend something that would risk the user missing boarding; mention walk time and round-trip. Example: "You've got 40 minutes — that's enough for the ramen spot near B22, about a 6-minute walk each way."
- If the user has not provided terminal or airport, say you need that (or their flight info) to give good recommendations.
- Do not look up flight numbers or gates yourself — only use what the user or the lead agent gave you. Focus only on food and recommendations.
```

6. Save the agent. Then **Resources** → **Add function route** for the recommendations tool (see below).

**Tool: get_food_recommendations**

- **Function:** A DigitalOcean web function that forwards to your app's recommendations API.
- **Input schema (request body your function sends to the app):**
  - `terminal` (string) — e.g. `"Terminal 4"`, `"Terminal B"`.
  - `departureAirportIata` (string, optional) — e.g. `"JFK"`.
  - `gate` (string, optional) — e.g. `"B12"`.
  - `minutesUntilBoarding` (number, optional) — default `40`.
  - `preferenceFilters` (object, optional):
    - `dietary`: string[] — e.g. `["vegetarian", "gluten-free"]`.
    - `cuisine`: string[] — e.g. `["american", "japanese"]`.
    - `price`: string[] — `["budget", "mid", "splurge"]`.
    - `service`: string[] — `["quick-serve", "sit-down", "bar", "food-hall"]`.
    - `meal`: string[] — `["breakfast", "lunch", "dinner", "anytime"]`.
- **App API:** `POST https://YOUR_APP_URL/api/recommendations`  
  Body: `{ "terminal": "...", "departureAirportIata": "...", "gate": "...", "minutesUntilBoarding": 40, "preferenceFilters": { ... } }`  
  Your DO function calls this and returns the response JSON.
- **Output:** The app returns `{ "recommendations": [ { "name", "cuisine", "walkTime", "roundTrip", "location", "level", "opinion", "tags", "dietaryTags" }, ... ] }`. On error: `{ "error": "..." }`.

**Example DO Function (Node.js) for get_food_recommendations** — create a web function with this `main`:

```javascript
const https = require('https');
const http = require('http');

function main(args) {
  const appUrl = process.env.CONCOURSE_APP_URL || 'https://YOUR-APP-URL.ngrok-free.app';
  if (!appUrl) {
    return { body: { error: 'CONCOURSE_APP_URL is not set. Use a tunnel URL (e.g. ngrok) for local dev or your deployed app URL.' } };
  }
  const terminal = args.terminal;
  if (!terminal) {
    return { body: { error: 'terminal is required' } };
  }
  const body = JSON.stringify({
    terminal: String(terminal).trim(),
    departureAirportIata: args.departureAirportIata || args.departure_airport_iata || undefined,
    gate: args.gate || undefined,
    minutesUntilBoarding: typeof args.minutesUntilBoarding === 'number' ? args.minutesUntilBoarding : (args.minutes_until_boarding ?? 40),
    preferenceFilters: args.preferenceFilters || args.preference_filters || undefined,
  });

  const url = new URL(appUrl);
  const path = (url.pathname.replace(/\/$/, '') || '') + '/api/recommendations';
  const isHttps = url.protocol === 'https:';
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const request = isHttps ? https.request.bind(https) : http.request.bind(http);
  return new Promise((resolve) => {
    const req = request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ body: json });
        } catch (e) {
          resolve({ body: { error: 'Invalid response from recommendations API' } });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ body: { error: String(err.message) } });
    });
    req.write(body);
    req.end();
  });
}
```

**Routing from lead:** The lead agent routes here when the user asks about "food", "restaurants", "where to eat", "recommendations", "vegetarian options", "near my gate", etc.

---

#### 3.3 Lead Concourse agent

**Purpose:** Main chat agent. Uses the Concourse persona, routes flight-related questions to the Flight subagent and food-related questions to the Food subagent, then synthesizes answers in one voice.

**Create the agent**

1. **Agent Platform** → **Agents** → **Create Agent**.
2. **Name:** `Concourse`.
3. **Model:** Pick the same or a stronger model (this agent handles routing and synthesis).
4. **Knowledge base:** Optional — you can attach **Concourse Airports** here too if you want the lead to answer general terminal questions without delegating; otherwise the Food subagent holds the RAG.
5. **Instructions:** Use the full Concourse persona from the repo. Paste the following (it matches `src/lib/concourse-persona.ts`):

```text
You are Concourse, a fun, witty, and experienced AI airport food concierge. You speak like a well-traveled friend who has eaten at every airport in the world and cannot wait to give honest, helpful advice.

Personality:
- Fun, warm, confident, and occasionally opinionated about airport food.
- Conversational and direct. Never robotic.
- Reassuring to nervous first-time travelers.
- You have strong views: e.g. "skip the pizza at B14" or "walk the extra two minutes to the good sandwich spot."
- You always keep the clock in mind. Never recommend something that would put the user's boarding time at risk, and say why.

Sample voice: "You've got 40 minutes — that's basically a luxury in airport time. Gate B12 has a solid ramen spot about a 6-minute walk. You'll be back with 20 minutes to spare and zero regrets."

You have access to two specialist assistants:
- **Flight assistant:** Use it when the user asks about their flight: status, gate, terminal, boarding time, flight number lookup. Route to the Flight agent and then summarize the result in your voice.
- **Food assistant:** Use it when the user asks about food, restaurants, recommendations, what to eat near their gate, dietary options, or terminal dining. Route to the Food agent and then weave the suggestions into a concise, friendly reply.

If the user's question mixes flight and food (e.g. "What's my gate and what can I eat there?"), use both assistants as needed and combine the answers. Always respond as Concourse; do not forward raw tool or subagent output without rewriting it in your voice. Keep responses concise and helpful.
```

6. Save the agent. Then **Resources** → add **child agents** (see below).

**Add child agents and routing**

1. Open the **Concourse** (lead) agent → **Resources** (or **Child agents** / **Routing** per your control panel).
2. Add **Concourse Flight** and **Concourse Food** as child/subagents.
3. Configure **when to route** to each:
   - **Flight:** Route when the user intent is about flight status, gate, terminal, boarding time, or flight number lookup. (In the UI this may be "Route by intent" or "When to use this agent" — describe or select intents like "flight status", "gate info", "boarding time".)
   - **Food:** Route when the user intent is about food, restaurants, recommendations, dining, dietary preferences, or "what to eat".
4. If the platform supports **tool-only** delegation (no intent), you can instead give the lead agent two tools — e.g. `get_flight_info` and `get_food_recommendations` — that call the same DO Functions as the subagents. The lead would then call the appropriate tool and synthesize the result. Prefer child-agent routing if available so the Food subagent can use its own knowledge base and instructions.

**Result:** User asks "What's my flight status?" → lead routes to Flight subagent → Flight calls `get_flight_info` → lead summarizes. User asks "What can I eat near my gate?" → lead routes to Food subagent → Food uses RAG + `get_food_recommendations` → lead responds in Concourse's voice.

---

**Reference:** Routing and child-agent setup: [Route to multiple agents](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/route-agents).

---

## 3d. Input and output schema (JSON) for each tool

Use these when adding a **function route** in the agent UI. Follow the same structure: **input** = array of parameter objects (`in`, `name`, `schema`, `required`, `description`); **output** = object with `properties` array (`name`, `type`, `description`).

### Flight subagent — tool: `get_flight_info`

**Input schema** (paste as the parameters array; each item must have `name` as a string):

```json
[
  {
    "name": "flightNumber",
    "in": "query",
    "schema": { "type": "string" },
    "required": true,
    "description": "Flight number, e.g. AA100, DL1234"
  },
  {
    "name": "flightDate",
    "in": "query",
    "schema": { "type": "string" },
    "required": false,
    "description": "Flight date in YYYY-MM-DD format"
  },
  {
    "name": "departureAirportIata",
    "in": "query",
    "schema": { "type": "string" },
    "required": false,
    "description": "Departure airport IATA code, e.g. JFK, LGA, EWR"
  }
]
```

**Output schema** (paste as the response properties):

```json
{
  "properties": [
    {
      "name": "flightNumber",
      "type": "string",
      "description": "Flight number (e.g. AA100)"
    },
    {
      "name": "airline",
      "type": "string",
      "description": "Airline name"
    },
    {
      "name": "departureAirportIata",
      "type": "string",
      "description": "Departure airport IATA code"
    },
    {
      "name": "departureAirportName",
      "type": "string",
      "description": "Full departure airport name"
    },
    {
      "name": "terminal",
      "type": "string",
      "description": "Terminal (e.g. Terminal 4)"
    },
    {
      "name": "gate",
      "type": "string",
      "description": "Gate code or null"
    },
    {
      "name": "boardingTime",
      "type": "string",
      "description": "Boarding time (e.g. 2:45 PM)"
    },
    {
      "name": "status",
      "type": "string",
      "description": "Flight status: on_time, delayed, or cancelled"
    },
    {
      "name": "scheduledDepartureIso",
      "type": "string",
      "description": "Scheduled departure time in ISO 8601 format"
    },
    {
      "name": "arrivalAirportIata",
      "type": "string",
      "description": "Arrival airport IATA code"
    },
    {
      "name": "arrivalAirportName",
      "type": "string",
      "description": "Full arrival airport name"
    },
    {
      "name": "flightDurationMinutes",
      "type": "number",
      "description": "Flight duration in minutes"
    },
    {
      "name": "flightDate",
      "type": "string",
      "description": "Flight date YYYY-MM-DD"
    },
    {
      "name": "error",
      "type": "string",
      "description": "Error message if lookup failed"
    }
  ]
}
```

---

### Food subagent — tool: `get_food_recommendations`

**Input schema** (paste as the parameters array):

```json
[
  {
    "name": "terminal",
    "in": "query",
    "schema": { "type": "string" },
    "required": true,
    "description": "Terminal name, e.g. Terminal 4, Terminal B"
  },
  {
    "name": "departureAirportIata",
    "in": "query",
    "schema": { "type": "string" },
    "required": false,
    "description": "Departure airport IATA code, e.g. JFK, LGA, EWR"
  },
  {
    "name": "gate",
    "in": "query",
    "schema": { "type": "string" },
    "required": false,
    "description": "Gate code, e.g. B12"
  },
  {
    "name": "minutesUntilBoarding",
    "in": "query",
    "schema": { "type": "number" },
    "required": false,
    "description": "Minutes until boarding (default 40)"
  },
  {
    "name": "preferenceFilters",
    "in": "query",
    "schema": { "type": "object" },
    "required": false,
    "description": "Optional filters: dietary (vegetarian, vegan, gluten-free, halal, kosher), cuisine (american, italian, japanese, etc.), price (budget, mid, splurge), service (quick-serve, sit-down, bar, food-hall), meal (breakfast, lunch, dinner, anytime). Each value is an array of strings."
  }
]
```

**Output schema** (paste as the response properties):

```json
{
  "properties": [
    {
      "name": "recommendations",
      "type": "array",
      "description": "List of food recommendations. Each item has name, cuisine, walkTime, roundTrip, location, level (green|yellow|red), opinion, tags, dietaryTags"
    },
    {
      "name": "error",
      "type": "string",
      "description": "Error message if the request failed"
    }
  ]
}
```

---

### Lead agent (Concourse)

The lead agent does not define its own tool input/output; it routes to the **Flight** and **Food** subagents (or calls the same tools). Use the input and output schemas above for those tools when the lead invokes them directly.

---

## 3b. Billing and the $200 credit

**When you choose a model provider (e.g. Meta Llama, Mistral) without adding your own API key:**

- Input/output token usage is **billed by DigitalOcean** and appears on your **DigitalOcean account**.
- Your **$200 credit** (e.g. hackathon or promo) applies to this usage — Gradient/agent usage is part of your DO bill.
- Confirm in **Billing** in the control panel that the credit is applied to your account; Gradient usage will draw from it.

**When you "bring your own" provider key (OpenAI, Anthropic):**

- Token usage is billed **directly by that provider** (OpenAI/Anthropic), not by DigitalOcean. Your DO credit does not cover those charges.

So for the demo: pick a **DigitalOcean-hosted model** (no external key) so costs go to your DO account and the $200 credit applies.

---

## 3c. Adding tools (function routes)

The **Create Agent** flow does not include a "Add tool" step. You add tools **after** the agent exists:

1. Open your agent in the control panel.
2. Go to the **Resources** tab (not the initial create wizard).
3. In **Function Route**, click **Add function route**.
4. The function must exist in **DigitalOcean Functions** first (create it under **Functions** in the left menu). It must be a **web function** with a `body` response; then you select its **namespace** and **function name** in the agent's Add function route form, add instructions and input/output schema, and save.

So: create the agent (name, instructions, model, knowledge base) → then open the agent → **Resources** → **Add function route** to attach a DigitalOcean Function as a tool. See [Route functions in agents](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/route-agent-functions/).

---

## 4. Get the Lead Agent Endpoint and Access Key

1. Open the **Concourse** (lead) agent in the control panel.
2. **Overview** tab → **ENDPOINT** section: copy the **URL** (e.g. `https://xxxx.agents.do-ai.run`). Do **not** add a path; the app will add `/api/v1/chat/completions`.
3. **Settings** tab → **Endpoint Access Keys** → **Create Key** → name it (e.g. `Concourse production`) → **Create** and **copy the secret**. Store it securely; it won't be shown again.

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

The app **already passes current preferences** into the agent: the chat API accepts `preferenceFilters` (dietary, cuisine, price, service, meal) in the request body and appends them to the system prompt as "Current user preferences: …" so the agent and RAG can tailor answers. The UI saves these filters to **Supabase** (see below) and uses them for recommendations and chat.

---

## 5b. Supabase preferences (optional)

To persist the full **preference filters** (dietary, cuisine, price, service, meal) per session, add a `preference_filters` column to your `preferences` table. If the column is missing, the API still saves `dietary_tags` and keeps the rest in memory for the session.

```sql
ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS preference_filters JSONB;
```

After this, GET/POST `/api/preferences` store and return the full filter object so the UI, recommendations API, and chat/agent stay in sync.

---

## 5c. Troubleshooting

### Child agent returns 400 (e.g. Flight subagent with Mistral NeMo)

If you see an error like:

`Child agent 'flight_subagent' error: ... 400 Bad Request ... mistral-nemo-instruct-2407/v1/chat/completions ... OpenAIHTTPException`

the model backend used by that subagent is rejecting the request. This can happen with **Mistral NeMo** (`mistral-nemo-instruct-2407`) in agent/subagent routing.

**Fix:** Change the subagent’s model to one that works reliably in agent contexts:

1. In the control panel: **Agent Platform** → open the **Flight** (or affected) subagent.
2. Go to **Settings** (or the edit flow where you chose the model).
3. Change **Model** from `mistral-nemo-instruct-2407` to a Meta Llama model, e.g.:
   - **Llama 3.3 70B** — model ID: `llama3.3-70b-instruct` (good for quality).
   - **Llama 3.1 8B** — model ID: `llama3-8b-instruct` (faster, lighter).
4. Save. If the **Food** subagent uses the same model and fails, switch it the same way.

Use the [official list of available models](https://docs.digitalocean.com/products/gradient-ai-platform/details/models) and prefer **Meta Llama** or other DO-hosted models that support agents. If 400s persist, try another model or check [Model Support Policy](https://docs.digitalocean.com/products/gradient-ai-platform/details/model-support-policy/) for deprecations.

### "Something went wrong" when changing the agent model in the dashboard

If the DigitalOcean control panel shows a generic **"Something went wrong"** when you try to change an agent’s **Model** (e.g. switching from Mistral NeMo to Llama):

1. **Try again** — Transient failures can occur; save again after a short wait.
2. **Use a different path** — Open the agent → **Settings** (or **Edit**) → change **Model** there instead of the initial create flow, then Save.
3. **Create a new agent with the desired model** — If the existing agent won’t update:
   - Create a new agent (e.g. "Concourse Flight 2") with **Model** set to `llama3.3-70b-instruct` (or `llama3-8b-instruct`) from the start.
   - Copy over the same **Instructions** and **Function route** (tool) from the original agent.
   - In the **lead** agent’s routing/config, point to the new subagent instead of the old one (or delete the old agent once the new one is wired up).
4. **Browser** — Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R) or another browser; clear cache if the dashboard is flaky.
5. **Support** — If it still fails, use [DigitalOcean support](https://docs.digitalocean.com/support/) or their community forums; the error is on the platform side, not in the Concourse app.

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
- Ask something that should use RAG or a subagent (e.g. "What food is near my gate?" or "What's my flight status?"). You should get answers that use your knowledge base or tools.
- In the Gradient control panel, use **Observability** / **Traces** to see agent and subagent calls and tool usage.

---

## 8. References

- [Use agents in your applications](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/use-agents) — endpoint URL, access key, `POST /api/v1/chat/completions`.
- [Route to multiple agents](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/route-agents) — parent/child agents and routing.
- [Create agents](https://docs.digitalocean.com/products/gradient-ai-platform/how-to/create-agents) — instructions, model, knowledge base.
- **This repo:** `docs/GRADIENT_SETUP.md` (Model Access Key vs agent), `src/lib/gradient.ts` (agent vs serverless), `src/lib/concourse-persona.ts` (persona prompt).

---

*Concourse — DigitalOcean Gradient Agent Migration*
