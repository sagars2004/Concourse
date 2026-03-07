import { NextResponse } from "next/server";
import { concourseChat } from "@/lib/gradient";
import { CONCOURSE_SYSTEM_PROMPT } from "@/lib/concourse-persona";
import { getGradientClient } from "@/lib/gradient";

const STUB_RESPONSES: string[] = [
  "Shake Shack at Gate B14 — it's a 4-minute walk from your gate. Grab the ShackBurger, you'll be back in your seat in under 15 minutes with zero regrets. Pro tip: order on their app while you walk to skip the line.",
  "You've got 40 minutes — that's basically luxury in airport time. I'd go for the ramen spot near B22 if you're hungry for something warm, or Shake Shack if you want something quick and reliable.",
  "Happy to help! Ask me about any spot or change your dietary preferences anytime.",
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const userMessage = typeof body?.message === "string" ? body.message : "";

    if (!userMessage.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const client = getGradientClient();
    if (client) {
      const fullMessages = [
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: userMessage.trim() },
      ];
      const content = await concourseChat(
        fullMessages,
        CONCOURSE_SYSTEM_PROMPT
      );
      return NextResponse.json({ message: content || "I'm not sure what to say — try again?" });
    }

    const index = Math.min(
      Math.floor(Math.random() * STUB_RESPONSES.length),
      STUB_RESPONSES.length - 1
    );
    return NextResponse.json({ message: STUB_RESPONSES[index] });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
