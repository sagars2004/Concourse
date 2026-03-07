# DigitalOcean Gradient AI — Setup Guide

This guide covers how to get API keys and (optionally) set up a Concourse agent on DigitalOcean so the chat uses Gradient.

---

## Option A: Quick path — Model Access Key (current app)

Your app is already wired to use **serverless inference**: it sends chat messages to a foundation model (e.g. Llama) with the Concourse system prompt. No agent is required.

### 1. Open Gradient in the control panel

1. Log in at [cloud.digitalocean.com](https://cloud.digitalocean.com).
2. In the left sidebar, open **Agent Platform** (or **Gradient AI** / **Gen AI**, depending on the menu).
3. Go to the **Serverless Inference** section/tab.

### 2. Create a Model Access Key

1. In **Serverless Inference**, find the **Model Access Keys** (or **API Keys**) section.
2. Click **Create Access Key** (or **Create**).
3. Name it (e.g. `Concourse app`) and create.
4. **Copy the key immediately** — it may be shown only once. This is your `DO_GRADIENT_API_KEY`.

### 3. Add the key to your app

In `.env` or `.env.local`:

```bash
DO_GRADIENT_API_KEY=<paste the key you copied>
```

Restart the dev server. The chat will use Gradient with the Concourse persona prompt. No agent or knowledge base is required for this path.

### 4. (Optional) Use a different model

By default the app uses `llama3.3-70b-instruct`. To use another model:

```bash
GRADIENT_CHAT_MODEL=<model-id>
```

Check DigitalOcean’s [foundation models list](https://docs.digitalocean.com/products/gradient-ai-platform/details/models/) for valid model IDs.

---

## Option B: Full path — Create a Concourse agent (optional)

For the full PRD (RAG, multi-agent, knowledge base), you can create an agent in the control panel and later point the app at its endpoint.

### 1. Create a knowledge base (for RAG)

1. In the control panel, click **Create** → **Knowledge Bases**.
2. Name it (e.g. `Concourse Airports`).
3. **Select data source:** e.g. **File upload** and upload your airport data (e.g. export the contents of `src/data/airports/` as documents), or **URL for web crawling** if you host the data.
4. Choose where to store the index (e.g. a new or existing OpenSearch cluster).
5. Pick an **embedding model** and complete creation. Wait for indexing to finish.

### 2. Create the agent

1. In the left menu, go to **Agent Platform** → your workspace (e.g. **My Agent Workspace**).
2. Click **Create Agent**.
3. **Agent name:** e.g. `Concourse`.
4. **Agent instructions:** Paste or adapt the Concourse persona (see `src/lib/concourse-persona.ts`). Example:

   ```text
   You are Concourse, a fun, witty, experienced AI airport food concierge...
   ```

5. **Select a model:** e.g. Llama or another foundation model you have access to.
6. **Knowledge base:** Attach the knowledge base you created (e.g. `Concourse Airports`).
7. Choose **project** and **region**, then click **Create Agent**.

### 3. Create an agent access key

1. Open the agent you just created.
2. Go to the **Settings** tab.
3. Under **Endpoint Access Keys**, click **Create Key**.
4. Name it (e.g. `Concourse production`), create, and **copy the key**.
5. Note the **agent endpoint URL** (e.g. on the agent’s Overview page).

### 4. Use the agent from the app (code change)

The app currently uses **serverless inference** (Option A). To use your **agent** instead, you’d need to:

- Add env vars: `GRADIENT_AGENT_ACCESS_KEY` and `GRADIENT_AGENT_ENDPOINT`.
- In `src/lib/gradient.ts`, use the agent endpoint for chat (e.g. call the agent’s `/api/v1/chat/completions` with the agent access key as Bearer token) instead of `client.chat.completions.create()`.

Until that change is made, only the **Model Access Key** (Option A) is used.

---

## Hackathon credits

If you’re in the DigitalOcean hackathon, ensure your account has Gradient / Gen AI enabled and that hackathon credits apply to the project you use. Check the hackathon rules for how to link credits to Gradient usage.

---

## Summary

| Goal                         | What to do |
|-----------------------------|------------|
| **Chat working with Concourse persona** | Use **Option A**: create a **Model Access Key** under Serverless Inference, set `DO_GRADIENT_API_KEY` in `.env`, restart the app. |
| **RAG + agent later**       | Use **Option B**: create a Knowledge Base, then an Agent, then an Agent Access Key; later update the app to call the agent endpoint. |

For a fast demo, Option A is enough.
