import Gradient from "@digitalocean/gradient";

const apiKey =
  process.env.DO_GRADIENT_API_KEY ?? process.env.GRADIENT_MODEL_ACCESS_KEY;

export function getGradientClient(): Gradient | null {
  if (!apiKey) return null;
  try {
    return new Gradient({ modelAccessKey: apiKey });
  } catch {
    return null;
  }
}

const DEFAULT_MODEL = "llama3.3-70b-instruct";

export async function concourseChat(
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<string> {
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
