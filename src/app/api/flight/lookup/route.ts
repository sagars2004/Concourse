import { NextResponse } from "next/server";
import type { FlightData } from "@/lib/types";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<
  string,
  { data: FlightData; expiresAt: number }
>();

function normalizeFlightNumber(input: string): string {
  return input.replace(/\s+/g, " ").trim().toUpperCase();
}

function parseAviationStackResponse(
  body: unknown,
  fallbackFlightNumber: string
): FlightData | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { data?: unknown }).data)) {
    return null;
  }
  const data = (body as { data: unknown[] }).data;
  const first = data[0];
  if (!first || typeof first !== "object") return null;

  const flight = first as {
    flight_status?: string;
    departure?: {
      terminal?: string;
      gate?: string | null;
      scheduled?: string;
      delay?: number;
    };
    airline?: { name?: string };
    flight?: { iata?: string; number?: string };
  };

  const dep = flight.departure;
  const scheduled = dep?.scheduled
    ? new Date(dep.scheduled)
    : null;
  const boardingTime = scheduled
    ? new Date(scheduled.getTime() - 35 * 60 * 1000)
    : null;
  const status =
    flight.flight_status === "cancelled"
      ? ("cancelled" as const)
      : (dep?.delay ?? 0) > 0
        ? ("delayed" as const)
        : ("on_time" as const);

  return {
    flightNumber: (flight.flight?.iata ?? fallbackFlightNumber).replace(/\s/g, ""),
    airline: flight.airline?.name ?? "Unknown",
    terminal: dep?.terminal ? `Terminal ${dep.terminal}` : "—",
    gate: dep?.gate ?? null,
    boardingTime: boardingTime
      ? boardingTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "—",
    minutesUntilBoarding: 40, // API doesn't provide; could derive from scheduled vs now
    status,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const raw = (body?.flightNumber ?? body?.flight_number ?? "").toString();
    const normalized = normalizeFlightNumber(raw);

    if (!normalized) {
      return NextResponse.json(
        { error: "Flight number is required" },
        { status: 400 }
      );
    }

    const cacheKey = normalized.replace(/\s/g, "");
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (apiKey) {
      const flightIata = normalized.replace(/\s/g, "");
      const url = new URL("https://api.aviationstack.com/v1/flights");
      url.searchParams.set("access_key", apiKey);
      url.searchParams.set("flight_iata", flightIata);
      url.searchParams.set("limit", "1");

      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      const data = await res.json();

      if (data?.error) {
        const code = data.error?.code;
        const msg = data.error?.message ?? "AviationStack error";
        return NextResponse.json(
          { error: msg },
          { status: code === "usage_limit_reached" ? 429 : 500 }
        );
      }

      const mapped = parseAviationStackResponse(data, normalized);
      if (mapped) {
        cache.set(cacheKey, {
          data: mapped,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return NextResponse.json(mapped);
      }
    }

    // Stub when no key or no API result
    const stub: FlightData = {
      flightNumber: normalized,
      airline: "American Airlines",
      terminal: "Terminal 4",
      gate: "B12",
      boardingTime: "2:45 PM",
      minutesUntilBoarding: 40,
      status: "on_time",
    };
    return NextResponse.json(stub);
  } catch (e) {
    console.error("Flight lookup error:", e);
    return NextResponse.json(
      { error: "Failed to lookup flight" },
      { status: 500 }
    );
  }
}
