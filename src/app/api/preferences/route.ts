import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const inMemoryStore = new Map<string, string[]>();

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get("x-session-id") ?? "";

    const supabase = getSupabase();
    if (supabase && sessionId) {
      const { data, error } = await supabase
        .from("preferences")
        .select("dietary_tags")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (!error && data?.dietary_tags?.length) {
        return NextResponse.json({
          dietaryPreferences: data.dietary_tags as string[],
        });
      }
    }

    const tags = inMemoryStore.get(sessionId) ?? ["none"];
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

    const supabase = getSupabase();
    if (supabase && sessionId) {
      await supabase.from("sessions").upsert(
        { id: sessionId },
        { onConflict: "id" }
      );

      const { error } = await supabase.from("preferences").upsert(
        {
          session_id: sessionId,
          dietary_tags: dietaryPreferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

      if (!error) {
        return NextResponse.json({ dietaryPreferences });
      }
    }

    if (sessionId) inMemoryStore.set(sessionId, dietaryPreferences);
    return NextResponse.json({ dietaryPreferences });
  } catch {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
