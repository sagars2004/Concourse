import { NextResponse } from "next/server";

const STUB_RESPONSES: string[] = [
  "Shake Shack at Gate B14 — it's a 4-minute walk from your gate. Grab the ShackBurger, you'll be back in your seat in under 15 minutes with zero regrets. Pro tip: order on their app while you walk to skip the line.",
  "You've got 40 minutes — that's basically luxury in airport time. I'd go for the ramen spot near B22 if you're hungry for something warm, or Shake Shack if you want something quick and reliable.",
  "Happy to help! Ask me about any spot or change your dietary preferences anytime.",
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const _messages = body?.messages ?? [];
    const _userMessage = body?.message ?? "";

    // Stub: return a canned Concourse response. Replace with Gradient in Phase 4.
    const index = Math.min(
      Math.floor(Math.random() * STUB_RESPONSES.length),
      STUB_RESPONSES.length - 1
    );
    const content = STUB_RESPONSES[index];

    return NextResponse.json({ message: content });
  } catch {
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
