import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { PreferenceFilters } from "@/lib/preference-filters";
import { DEFAULT_PREFERENCE_FILTERS } from "@/lib/preference-filters";

const inMemoryStore = new Map<string, PreferenceFilters>();

function parsePreferenceFilters(body: unknown): PreferenceFilters {
  const def = DEFAULT_PREFERENCE_FILTERS;
  if (!body || typeof body !== "object") return def;
  const o = body as Record<string, unknown>;
  const pf = o.preferenceFilters;
  if (!pf || typeof pf !== "object") {
    // Legacy: dietaryPreferences array
    const dietary = Array.isArray(o.dietaryPreferences) ? o.dietaryPreferences as string[] : def.dietary;
    return { ...def, dietary };
  }
  const p = pf as Record<string, unknown>;
  return {
    dietary: Array.isArray(p.dietary) ? (p.dietary as string[]) : def.dietary,
    cuisine: Array.isArray(p.cuisine) ? (p.cuisine as string[]) : def.cuisine,
    price: Array.isArray(p.price) ? (p.price as string[]) : def.price,
    service: Array.isArray(p.service) ? (p.service as string[]) : def.service,
    meal: Array.isArray(p.meal) ? (p.meal as string[]) : def.meal,
  };
}

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get("x-session-id") ?? "";

    const supabase = getSupabase();
    if (supabase && sessionId) {
      const { data, error } = await supabase
        .from("preferences")
        .select("dietary_tags, preference_filters")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (!error && data) {
        const stored = data as { dietary_tags?: string[]; preference_filters?: PreferenceFilters };
        if (stored.preference_filters && typeof stored.preference_filters === "object") {
          const pf = stored.preference_filters as unknown as Record<string, unknown>;
          return NextResponse.json({
            preferenceFilters: {
              dietary: Array.isArray(pf.dietary) ? pf.dietary : (stored.dietary_tags ?? DEFAULT_PREFERENCE_FILTERS.dietary),
              cuisine: Array.isArray(pf.cuisine) ? pf.cuisine : DEFAULT_PREFERENCE_FILTERS.cuisine,
              price: Array.isArray(pf.price) ? pf.price : DEFAULT_PREFERENCE_FILTERS.price,
              service: Array.isArray(pf.service) ? pf.service : DEFAULT_PREFERENCE_FILTERS.service,
              meal: Array.isArray(pf.meal) ? pf.meal : DEFAULT_PREFERENCE_FILTERS.meal,
            } as PreferenceFilters,
          });
        }
        if (stored.dietary_tags?.length) {
          return NextResponse.json({
            preferenceFilters: { ...DEFAULT_PREFERENCE_FILTERS, dietary: stored.dietary_tags },
          });
        }
      }
    }

    const stored = inMemoryStore.get(sessionId) ?? DEFAULT_PREFERENCE_FILTERS;
    return NextResponse.json({ preferenceFilters: stored });
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
    const preferenceFilters = parsePreferenceFilters(body);

    const supabase = getSupabase();
    if (supabase && sessionId) {
      await supabase.from("sessions").upsert(
        { id: sessionId },
        { onConflict: "id" }
      );

      const row: Record<string, unknown> = {
        session_id: sessionId,
        dietary_tags: preferenceFilters.dietary,
        updated_at: new Date().toISOString(),
      };
      // preference_filters column may not exist on all deployments; set it if present
      try {
        const { error } = await supabase.from("preferences").upsert(
          { ...row, preference_filters: preferenceFilters },
          { onConflict: "session_id" }
        );
        if (!error) {
          return NextResponse.json({ preferenceFilters });
        }
      } catch {
        // Fallback: upsert without preference_filters (e.g. column missing)
      }
      const { error } = await supabase.from("preferences").upsert(row, { onConflict: "session_id" });
      if (!error) return NextResponse.json({ preferenceFilters });
    }

    if (sessionId) inMemoryStore.set(sessionId, preferenceFilters);
    return NextResponse.json({ preferenceFilters });
  } catch {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
