import Gradient from "@digitalocean/gradient";

const apiKey =
  process.env.DO_GRADIENT_API_KEY ?? process.env.GRADIENT_MODEL_ACCESS_KEY;
const agentEndpoint = process.env.GRADIENT_AGENT_ENDPOINT?.replace(/\/$/, "");
const agentAccessKey = process.env.GRADIENT_AGENT_ACCESS_KEY;

export function getGradientClient(): Gradient | null {
  if (!apiKey) return null;
  try {
    return new Gradient({ modelAccessKey: apiKey });
  } catch {
    return null;
  }
}

/** True if the app is configured to use a DigitalOcean Gradient agent (orchestration, RAG, subagents). */
export function isAgentMode(): boolean {
  return !!(agentEndpoint && agentAccessKey);
}

const DEFAULT_MODEL = "llama3.3-70b-instruct";

/**
 * Send chat to Gradient. Uses the agent endpoint if GRADIENT_AGENT_ENDPOINT and
 * GRADIENT_AGENT_ACCESS_KEY are set (agent orchestration); otherwise uses serverless inference.
 */
export async function concourseChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string> {
  if (agentEndpoint && agentAccessKey) {
    return concourseChatViaAgent(messages, systemPrompt);
  }

  const client = getGradientClient();
  if (!client) throw new Error("Gradient not configured");

  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  const completion = await client.chat.completions.create({
    messages: fullMessages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    model: process.env.GRADIENT_CHAT_MODEL ?? DEFAULT_MODEL,
  });

  const content = completion.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

/** Call the DigitalOcean Gradient agent endpoint (supports RAG, subagents, orchestration). */
async function concourseChatViaAgent(
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string> {
  const url = `${agentEndpoint}/api/v1/chat/completions`;
  const fullMessages = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${agentAccessKey}`,
    },
    body: JSON.stringify({
      messages: fullMessages,
      stream: false,
      include_retrieval_info: true,
      include_functions_info: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent request failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}
