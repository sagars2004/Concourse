# CONCOURSE
## Product Requirements Document


## 1. Project Overview

Concourse is a full-stack AI-powered web application that acts as a personal airport food concierge for first-time and infrequent travelers. Travelers entering an unfamiliar airport often waste precious pre-flight time wandering terminals looking for food, unaware of walking distances, wait times, or whether they can make it back to their gate before boarding.

Concourse solves this by combining real-time flight data with a curated RAG knowledge base of airport terminal and dining information, delivering time-aware, personalized food recommendations through a witty, experienced AI persona — like having a seasoned frequent flyer friend who knows every airport by heart.

---

## 2. Target User

Primary users are first-time and infrequent travelers — people flying for work or leisure who are unfamiliar with their departure, connecting, or destination airport. These users:

- Do not know the terminal layout or where food is located relative to their gate
- Are anxious about missing their flight if they wander too far
- Have dietary preferences or restrictions but no easy way to filter options
- Would benefit from a confident, reassuring guide that handles the thinking for them

Secondary users include frequent travelers who want a faster, smarter way to find food at unfamiliar airports without pulling up multiple apps.

---

## 3. Core Features

### 3.1 Flight Lookup & Gate Detection
- User enters their flight number (e.g. AA 203)
- App calls AviationStack API to retrieve airline, terminal, scheduled gate, and boarding time
- App displays a clear summary: flight details, terminal, gate, and time until boarding
- If gate is unavailable via API, user can manually confirm or enter their gate

### 3.2 Time-Aware Food Recommendations
- Based on gate location and boarding time, Concourse calculates how much time the traveler has
- Food options are filtered and ranked by walking distance from the gate
- Each recommendation includes estimated walk time (there and back) so the traveler knows if it is safe
- A confidence indicator is shown: Green (plenty of time), Yellow (tight but doable), Red (stay near gate)

### 3.3 Dietary Preference Filtering
- On first use, user sets dietary preferences: vegetarian, vegan, gluten-free, halal, kosher, or no restrictions
- Preferences persist for the session and filter food recommendations accordingly
- User can update preferences at any time

### 3.4 Terminal Map Visualization
- Simplified interactive terminal map rendered via Mapbox GL JS
- Shows the user's gate, nearby food vendors, and a suggested walking route
- Map data is manually seeded for 3 demo airports: JFK Terminal 4, LAX Terminal B, ORD Terminal 3

### 3.5 Gate Change Alerts
- If a gate change is detected (via API polling or simulated trigger in demo), Concourse alerts the user immediately
- Re-routes food recommendations based on the new gate location
- Delivers the alert with a witty, reassuring message in Concourse's persona voice

### 3.6 Concourse AI Persona
- Concourse speaks as a fun, witty, experienced frequent flyer who has eaten at every airport in the world
- Responses are conversational, confident, and occasionally opinionated (e.g. "skip the pizza at B14")
- Persona is consistent across recommendations, alerts, and follow-up conversational questions
- User can ask follow-up questions: "Is there a Starbucks nearby?", "What's the quickest option?", "Is this place any good?"

---

## 4. AI & Agent Architecture (DigitalOcean Gradient)

The application uses DigitalOcean Gradient AI for all agent orchestration, RAG, and inference. Three agents work together under a lead persona agent.

| Agent | Responsibility |
|---|---|
| Lead Agent (Concourse) | Handles all user-facing conversation, persona delivery, recommendation synthesis, and follow-up Q&A. Orchestrates sub-agents and formats final responses. |
| Flight Sub-Agent | Queries AviationStack API for flight data (gate, terminal, boarding time, delay status). Returns structured data to the lead agent. |
| Food / RAG Sub-Agent | Queries the RAG knowledge base for restaurant and vendor data by terminal. Filters by dietary preference and proximity. Returns ranked options to the lead agent. |

### 4.1 RAG Knowledge Base

The RAG knowledge base is seeded manually with structured data for 3 demo airports. Each airport entry includes:

- Terminal name and layout zones (e.g. pre-security, post-security, by gate cluster)
- Restaurant and vendor listings: name, cuisine type, dietary tags, location zone, hours, average wait time
- Walking time estimates between gate clusters and vendor zones
- General terminal tips and notable picks written in Concourse's voice

Demo airports:
- JFK, EWR, LGA, etc...

### 4.2 Gradient Features Used

- Multi-agent orchestration — lead agent routing to two specialized sub-agents
- RAG / Knowledge bases — terminal layout and vendor data
- Serverless inference — powering all conversational responses
- Function calling — Flight sub-agent calls AviationStack via a serverless function

---

## 5. Data Strategy: Live API vs Mock Data

To keep the project at $0 out-of-pocket cost, the app uses a hybrid approach of live free-tier API data and manually seeded mock data for demo purposes.

| Data Type | Source & Approach |
|---|---|
| Flight number lookup | Live — AviationStack free tier. Returns airline, scheduled gate, terminal, departure time. |
| Delay status | Live — AviationStack free tier. |
| Real-time gate changes | Mocked — A demo trigger simulates a gate change notification with a hardcoded re-route scenario. |
| Terminal maps | Mocked — Static SVG or Mapbox custom layer for JFK T4, LAX TB, ORD T3. Hand-drawn based on public airport maps. |
| Restaurant / vendor listings | Mocked — Manually seeded into RAG knowledge base from public airport websites. |
| Walking time estimates | Mocked — Hardcoded distance/time values between gate clusters and vendor zones per airport. |
| User preferences | Live — Stored in Supabase free tier per session. |

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn/ui |
| Map Visualization | Mapbox GL JS (free tier) |
| Backend / API Routes | Next.js API Routes (server-side, same repo) |
| AI Agents & Inference | DigitalOcean Gradient — multi-agent orchestration, RAG, serverless inference |
| Flight Data | AviationStack API (free tier) |
| Database | Supabase (free tier) — user preferences and session data |
| Deployment | DigitalOcean App Platform (covered by $200 DO credits) |
| Version Control | GitHub (public repo, OSI-approved open source license) |

---

## 7. API Endpoints

All endpoints are Next.js API routes located under /api/.

| Endpoint | Description |
|---|---|
| POST /api/flight/lookup | Accepts flight number. Calls AviationStack API server-side. Returns airline, terminal, gate, boarding time, delay status. |
| POST /api/recommendations | Accepts terminal, gate, boarding time, and dietary preferences. Triggers Food RAG sub-agent. Returns ranked food options with walk times. |
| POST /api/chat | Accepts user message and conversation history. Sends to Lead Concourse agent. Returns persona-driven conversational response. |
| GET /api/gate/status | Polls or simulates gate change status for a given flight. Returns current gate (live or mocked). |
| POST /api/preferences | Saves or updates user dietary preferences to Supabase. |
| GET /api/preferences | Retrieves stored user dietary preferences from Supabase. |

---

## 8. Core User Flow

1. **Enter Flight** — User lands on the homepage and enters their flight number.
2. **Flight Confirmed** — App displays flight summary (airline, gate, terminal, boarding time). User confirms or manually adjusts gate if needed.
3. **Set Preferences** — User selects dietary preferences (or skips). Preferences are saved to Supabase.
4. **Recommendations** — Concourse presents top food options with walk times, a time confidence indicator (green/yellow/red), and opinionated commentary.
5. **Map View** — User can view the terminal map showing their gate and recommended food spots with a suggested walking route.
6. **Follow-up Chat** — User can ask Concourse follow-up questions in a chat interface. Concourse responds in persona.
7. **Gate Change Alert** — If gate changes (live or demo trigger), Concourse alerts the user and re-routes recommendations automatically.

---

## 9. Concourse AI Persona Definition

The Concourse persona is central to the Best AI Agent Persona prize target. The following guidelines define how the agent should behave and speak.

- **Name:** Concourse
- **Personality:** Fun, witty, warm, and confident. Like a well-traveled friend who has eaten at every airport in the world and cannot wait to give you their honest take.
- **Tone:** Conversational and direct. Never robotic. Occasionally opinionated. Always reassuring to nervous first-timers.
- **Opinions:** Concourse has strong views about airport food. It will tell you to skip the mediocre pizza and walk the extra two minutes to the good sandwich spot.
- **Urgency awareness:** Concourse always keeps an eye on the clock. It will never recommend something that puts your boarding time at risk, and it tells you exactly why.
- **Sample voice:** "You've got 40 minutes — that's basically a luxury in airport time. Gate B12 has a solid ramen spot about a 6-minute walk. You'll be back with 20 minutes to spare and zero regrets."

---

## 10. Judging Criteria Alignment

| Criterion | How Concourse Addresses It |
|---|---|
| Technological Implementation | Multi-agent Gradient architecture, RAG knowledge base, serverless inference, live flight API integration, full-stack Next.js app deployed on DO App Platform. |
| Design | Clean, mobile-friendly UI with Shadcn/ui components, Mapbox terminal visualization, time confidence indicators, and a conversational chat interface. |
| Potential Impact | Millions of first-time and infrequent travelers pass through unfamiliar airports every year. Concourse directly addresses a real, stressful, universal travel pain point. |
| Quality of Idea | Novel combination of real-time flight data, RAG-powered local knowledge, and a distinctive AI persona applied to an underserved travel use case. |
| Best AI Agent Persona (Bonus) | Concourse is a fully defined, consistently voiced persona with opinions, humor, and situational awareness — not just a utility chatbot. |

---

## 11. Cost Breakdown

This project is designed to be built and demoed at $0 out-of-pocket cost.

| Service | Cost |
|---|---|
| DigitalOcean Gradient (agents, RAG, inference) | $0 — covered by $200 DO hackathon credits |
| DigitalOcean App Platform (hosting) | $0 — covered by DO credits |
| AviationStack API | $0 — free tier (100 requests/month, sufficient for demo) |
| Mapbox GL JS | $0 — free tier (50,000 map loads/month) |
| Supabase | $0 — free tier (500MB DB, 2GB bandwidth) |
| GitHub | $0 — public repo |
| **Total out-of-pocket** | **$0** |

---

## 12. Hackathon Submission Checklist

- [ ] Public GitHub repository with OSI-approved open source license
- [ ] README with setup instructions and project description
- [ ] Deployed demo on DigitalOcean App Platform
- [ ] Demo video (under 3 minutes) uploaded to YouTube showing full user flow
- [ ] Devpost submission with text description, video link, repo link, and DO Gradient usage details
- [ ] Dietary preference filtering functional in demo
- [ ] Gate change simulation trigger visible in demo video
- [ ] Concourse persona clearly showcased in demo video for Agent Persona prize

---

*Concourse PRD v1.0 | DigitalOcean Gradient AI Hackathon 2026*
