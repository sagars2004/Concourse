# Concourse Knowledge Base — JFK, LGA, EWR, RDU

This folder contains the **full food and dining dataset** for four focus airports, for use in the DigitalOcean Gradient knowledge base (RAG) and in the Concourse app.

## File

- **`concourse-airports-jfk-lga-ewr-rdu.json`** — Single JSON file with all airports, terminals, zones, and vendors. Use this when creating your Gradient knowledge base.

## How to add this to DigitalOcean

1. In the [DigitalOcean Control Panel](https://cloud.digitalocean.com), go to **Agent Platform** → **Knowledge Bases** → **Create**.
2. **Name:** e.g. `Concourse Airports`.
3. **Data source:** Choose **File upload**.
4. Upload **`concourse-airports-jfk-lga-ewr-rdu.json`** (from this folder).
5. Complete the rest of the setup (index, embedding model) and wait for indexing to finish.
6. Attach this knowledge base to your Concourse agent (or Food subagent) so it can answer questions about food at JFK, LGA, EWR, and RDU.

## What’s inside the JSON

- **airports[]** — One entry per airport (JFK, LGA, EWR, RDU).
- Each airport has **terminals[]** with:
  - **terminal** — e.g. `"Terminal 4"`, `"Terminal B"`.
  - **description** — Short overview of that terminal.
  - **zones[]** — Gate areas and walk times from a reference gate.
  - **vendors[]** — For each vendor:
    - **name**, **cuisine**, **zoneId**, **dietaryTags**, **tags**, **avgWaitMinutes**, **opinion**
    - **priceRange** — `budget` | `mid` | `splurge` (for filtering and RAG).
    - **serviceType** — `quick-serve` | `sit-down` | `bar` | `food-hall`.
    - **mealTypes** — `["breakfast", "lunch", "dinner", "anytime"]`.
    - **cuisineCategories** — e.g. `["american", "italian", "coffee"]` (matches UI filter IDs).
    - **shortDescription** — One-line summary for RAG and display.
  - **tips** — Concourse-style tips for that terminal.

These fields align with the app’s **preference filters** (Dietary, Cuisine, Price, Service, Meal) so the DigitalOcean agent and RAG can filter and recommend by user preferences.

The app’s in-repo data (`src/data/airports/*.json`) uses the same structure for JFK T4, LGA T B, EWR T C, and RDU T2 so recommendations and the map stay in sync. You can edit either the knowledge-base JSON or the per-terminal JSONs and re-export/sync as needed.
