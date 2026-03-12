import type { Metadata } from "next";
import Link from "next/link";
import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToConcourseLink } from "@/components/back-to-concourse-link";

export const metadata: Metadata = {
  title: "How It Works — Concourse",
  description: "Here is a technical overview of my app, Concourse.",
};

export default function HowItWorksPage() {

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <BackToConcourseLink />

        <header className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Plane className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">How Concourse Works</h1>
          </div>
          <p className="text-lg text-muted-foreground">
          Here is a technical overview of my app, covering the tech stack, APIs, architecture, user flow, and integrations.
          </p>
        </header>

        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Project Overview</h2>
            <Card>
              <CardContent className="pt-5">
                <p className="text-muted-foreground leading-relaxed">
                  Concourse is an AI-powered airport food concierge for first-time and infrequent travelers. It combines{" "}
                  <strong className="text-foreground">real-time flight data</strong> with a curated{" "}
                  <strong className="text-foreground">RAG knowledge base</strong> of terminal and dining information to
                  deliver time-aware, personalized food recommendations through a witty, experienced AI persona — like
                  having a seasoned frequent flyer friend who knows every airport by heart.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">User Flow</h2>
            <Card>
              <CardContent className="pt-5">
                <ol className="list-decimal space-y-3 pl-5 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Enter flight</strong> — User enters flight number on the homepage.
                  </li>
                  <li>
                    <strong className="text-foreground">Flight confirmed</strong> — App shows airline, gate, terminal, boarding time; user can adjust gate if needed.
                  </li>
                  <li>
                    <strong className="text-foreground">Set preferences</strong> — User selects dietary preferences (vegetarian, vegan, etc.); stored in Supabase.
                  </li>
                  <li>
                    <strong className="text-foreground">Recommendations</strong> — Concourse shows food options with walk times and a time-confidence indicator (green / yellow / red).
                  </li>
                  <li>
                    <strong className="text-foreground">Map view</strong> — Interactive terminal map (Mapbox) shows gate and nearby food with a suggested walking route.
                  </li>
                  <li>
                    <strong className="text-foreground">Chat</strong> — User can ask follow-up questions; the Concourse agent responds in persona.
                  </li>
                  <li>
                    <strong className="text-foreground">Gate change alert</strong> — If the gate changes (live or simulated), the app alerts the user and re-routes recommendations.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Tech Stack</h2>
            <Card>
              <CardContent className="pt-5">
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Frontend:</strong> Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui,
                    Lucide icons, Cobe (WebGL globe), custom bento layout, and a global light/dark theme driven by{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono">next-themes</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">Maps:</strong> Mapbox GL JS for terminal visualization and gate/vendor overlays.
                  </li>
                  <li>
                    <strong className="text-foreground">Backend:</strong> Next.js API Routes (in this repo) deployed to DigitalOcean App
                    Platform.
                  </li>
                  <li>
                    <strong className="text-foreground">AI & agents:</strong> DigitalOcean Gradient — multi-agent orchestration, RAG
                    knowledge bases, serverless inference, and tool calling for flight + food agents.
                  </li>
                  <li>
                    <strong className="text-foreground">Flight data:</strong> AviationStack API (free tier) for live schedules, gates and
                    delays.
                  </li>
                  <li>
                    <strong className="text-foreground">Database:</strong> DigitalOcean Managed PostgreSQL (target) or Supabase in this
                    demo — stores preference filters, sessions, and analytics events.
                  </li>
                  <li>
                    <strong className="text-foreground">Object storage:</strong> DigitalOcean Spaces for static assets (airport JSON,
                    map overlays, marketing images) and future export/report files.
                  </li>
                  <li>
                    <strong className="text-foreground">Deployment & infra:</strong> DigitalOcean App Platform for the web app, Functions
                    for lightweight webhooks/utilities, Gradient for AI workloads, and Spaces + Managed DB for data.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">APIs & Integrations</h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Next.js API Routes (internal)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">POST /api/flight/lookup</code> — Flight number →
                    AviationStack → airline, terminal, gate, boarding time, delay status (optionally cached in a DigitalOcean Managed DB).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">POST /api/recommendations</code> — Terminal, gate, and
                    preferences → ranked food options with walk times using in-repo JSON and Gradient RAG knowledge bases.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">POST /api/chat</code> — User message → DigitalOcean
                    Gradient lead agent → persona response, with calls out to flight + food tools as needed.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">GET /api/gate/status</code> — Gate change polling /
                    simulation endpoint used by the app and agents.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">POST /api/preferences</code> — Persist dietary preferences
                    to Supabase / DigitalOcean Managed PostgreSQL.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">GET /api/preferences</code> — Retrieve stored preferences
                    per session.
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">External & cloud:</strong> AviationStack (flight lookup), DigitalOcean Gradient
                  (agents + RAG), DigitalOcean App Platform (app + API), DigitalOcean Spaces (static assets), Mapbox (maps), and
                  Supabase / DigitalOcean Managed PostgreSQL (preferences and session state).
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Architecture: AI & Agents</h2>
            <Card>
              <CardContent className="pt-5 space-y-4">
                <p className="text-muted-foreground">
                  The app uses <strong className="text-foreground">DigitalOcean Gradient</strong> for agent orchestration. Three agents work together:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Lead agent (Concourse)</strong> — Handles all user-facing chat, persona, and synthesis. Routes to sub-agents and formats final answers.</li>
                  <li><strong className="text-foreground">Flight sub-agent</strong> — Calls a DigitalOcean Function that forwards to the app’s <code className="rounded bg-muted px-1 py-0.5 font-mono">/api/flight/lookup</code> (AviationStack). Returns gate, terminal, boarding time.</li>
                  <li><strong className="text-foreground">Food / RAG sub-agent</strong> — Uses a knowledge base (airport terminals, vendors, dietary tags, walk times) and a function that calls <code className="rounded bg-muted px-1 py-0.5 font-mono">/api/recommendations</code>. Returns ranked food options.</li>
                </ul>
                <p className="text-muted-foreground">
                  The <strong className="text-foreground">RAG knowledge base</strong> is seeded with structured data for JFK, LGA, EWR (A, B, C), and RDU: terminal zones, vendor names, cuisines, dietary tags, opinions, and walk-time estimates. The Food agent uses it to answer questions and enrich tool results.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Core Features</h2>
            <Card>
              <CardContent className="pt-5">
                <ul className="space-y-3 text-muted-foreground">
                  <li><strong className="text-foreground">Flight lookup & gate detection</strong> — AviationStack API; user can override gate if needed.</li>
                  <li><strong className="text-foreground">Time-aware recommendations</strong> — Options ranked by walk distance; green/yellow/red confidence so users know if they have enough time.</li>
                  <li><strong className="text-foreground">Dietary filtering</strong> — Vegetarian, vegan, gluten-free, etc.; preferences persisted in Supabase.</li>
                  <li><strong className="text-foreground">Terminal map</strong> — Mapbox map with gate, nearby vendors, and a suggested route (50+ airports supported).</li>
                  <li><strong className="text-foreground">Gate change alerts</strong> — Simulated or live; recommendations re-routed and user notified in Concourse’s voice.</li>
                  <li><strong className="text-foreground">Concourse AI persona</strong> — Witty, opinionated, time-aware responses across chat, recommendations, and alerts.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Data Strategy</h2>
            <Card>
              <CardContent className="pt-5">
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Flight data:</strong> Live via AviationStack (free tier), with results cached for a
                    short TTL in the app/DB to avoid rate limits.
                  </li>
                  <li>
                    <strong className="text-foreground">Food/vendor data:</strong> Curated JSON in-repo plus a Gradient RAG knowledge base
                    (JFK, LGA, EWR, RDU) stored in DigitalOcean infrastructure for low-latency retrieval.
                  </li>
                  <li>
                    <strong className="text-foreground">Maps:</strong> Mapbox with seeded coordinates per airport/terminal and optional
                    static overlays served from DigitalOcean Spaces.
                  </li>
                  <li>
                    <strong className="text-foreground">Preferences:</strong> Supabase / DigitalOcean Managed PostgreSQL keyed by
                    anonymous session ID.
                  </li>
                  <li>
                    <strong className="text-foreground">Gate changes:</strong> Demo supports simulation and polling via{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono">/api/gate/status</code>; in production this would be wired to
                    airline/webhook feeds and Gradient background agents.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Hackathon & Judging</h2>
            <Card>
              <CardContent className="pt-5">
                <p className="mb-4 text-muted-foreground">
                  Concourse is built for the <strong className="text-foreground">DigitalOcean Gradient AI Hackathon 2026</strong>. It demonstrates:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Multi-agent orchestration</strong> — Lead agent + Flight and Food sub-agents with function calling.</li>
                  <li><strong className="text-foreground">RAG</strong> — Knowledge base of airport/vendor data used by the Food agent.</li>
                  <li><strong className="text-foreground">Full-stack app</strong> — Next.js front end and API routes, deployed on DigitalOcean App Platform.</li>
                  <li><strong className="text-foreground">AI persona</strong> — Concourse speaks consistently across chat, recommendations, and alerts with opinions and time-awareness.</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>

        <footer className="mt-16 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>Built for the DigitalOcean Gradient AI Hackathon 2026</p>
          <Link href="/" className="mt-2 inline-block font-medium text-foreground hover:underline">
            Try Concourse →
          </Link>
        </footer>
      </div>
    </div>
  );
}
