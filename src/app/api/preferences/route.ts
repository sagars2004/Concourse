import { NextResponse } from "next/server";

// In-memory store for stub. Keyed by sessionId. Phase 3 will use Supabase.
const store = new Map<string, string[]>();

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get("x-session-id") ?? "";
    const tags = store.get(sessionId) ?? ["none"];
    return NextResponse.json({ dietaryPreferences: tags });
  } catch {
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get("x-session-id") ?? "";
    const body = await request.json().catch(() => ({}));
    const dietaryPreferences = Array.isArray(body?.dietaryPreferences)
      ? body.dietaryPreferences
      : ["none"];

    if (sessionId) store.set(sessionId, dietaryPreferences);

    return NextResponse.json({ dietaryPreferences });
  } catch {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
