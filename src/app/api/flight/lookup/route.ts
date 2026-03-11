import { NextResponse } from "next/server";
import type { FlightData } from "@/lib/types";
import { insertSearch } from "@/lib/db";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map<
  string,
  { data: FlightData; expiresAt: number }
>();

function normalizeFlightNumber(input: string): string {
  return input.replace(/\s+/g, " ").trim().toUpperCase();
}

type AviationStackFlight = {
  flight_status?: string;
  departure?: {
    iata?: string;
    airport?: string;
    terminal?: string;
    gate?: string | null;
    scheduled?: string;
    delay?: number;
  };
  arrival?: {
    iata?: string;
    airport?: string;
    scheduled?: string;
  };
  airline?: { name?: string };
  flight?: { iata?: string; number?: string };
};

function parseSingleFlight(
  flight: AviationStackFlight,
  fallbackFlightNumber: string
): FlightData {
  const dep = flight.departure;
  const arr = flight.arrival;
  const scheduledDep = dep?.scheduled ? new Date(dep.scheduled) : null;
  const scheduledArr = arr?.scheduled ? new Date(arr.scheduled) : null;
  const boardingTime = scheduledDep
    ? new Date(scheduledDep.getTime() - 35 * 60 * 1000)
    : null;
  const status =
    flight.flight_status === "cancelled"
      ? ("cancelled" as const)
      : (dep?.delay ?? 0) > 0
        ? ("delayed" as const)
        : ("on_time" as const);

  let flightDurationMinutes: number | undefined;
  if (scheduledDep && scheduledArr && scheduledArr > scheduledDep) {
    flightDurationMinutes = Math.round((scheduledArr.getTime() - scheduledDep.getTime()) / (60 * 1000));
  }

  return {
    flightNumber: (flight.flight?.iata ?? fallbackFlightNumber).replace(/\s/g, ""),
    airline: flight.airline?.name ?? "Unknown",
    departureAirportIata: dep?.iata ?? undefined,
    departureAirportName: dep?.airport ?? undefined,
    terminal: dep?.terminal ? `Terminal ${dep.terminal}` : "—",
    gate: dep?.gate ?? null,
    boardingTime: boardingTime
      ? boardingTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "—",
    minutesUntilBoarding: 40,
    status,
    scheduledDepartureIso: dep?.scheduled ?? undefined,
    scheduledArrivalIso: arr?.scheduled ?? undefined,
    arrivalAirportIata: arr?.iata ?? undefined,
    arrivalAirportName: arr?.airport ?? undefined,
    flightDurationMinutes,
  };
}

function pickBestMatch(
  flights: AviationStackFlight[],
  fallbackFlightNumber: string,
  flightDate: string,
  departureAirportIata: string
): AviationStackFlight | null {
  if (!flights.length) return null;

  const depIataUpper = departureAirportIata.trim().toUpperCase();
  const targetDate = flightDate.trim(); // YYYY-MM-DD

  // Filter by departure airport if provided
  let candidates = flights;
  if (depIataUpper) {
    candidates = flights.filter(
      (f) => (f.departure?.iata ?? "").toUpperCase() === depIataUpper
    );
    if (candidates.length === 0) candidates = flights; // fallback if no match
  }

  // Filter by date if provided (match scheduled departure date)
  if (targetDate) {
    const byDate = candidates.filter((f) => {
      const scheduled = f.departure?.scheduled;
      if (!scheduled) return true; // keep if no date
      const d = new Date(scheduled);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}` === targetDate;
    });
    if (byDate.length > 0) candidates = byDate;
  }

  return candidates[0] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const raw = (body?.flightNumber ?? body?.flight_number ?? "").toString();
    const normalized = normalizeFlightNumber(raw);
    const flightDate =
      typeof body?.flightDate === "string"
        ? body.flightDate
        : typeof body?.flight_date === "string"
          ? body.flight_date
          : "";
    // When user doesn't provide a date, default to today so countdown can fall back to it if API lacks scheduled time
    const effectiveFlightDate =
      flightDate || new Date().toISOString().slice(0, 10);
    const departureAirportIata =
      typeof body?.departureAirportIata === "string"
        ? body.departureAirportIata.trim().toUpperCase()
        : "";

    if (!normalized) {
      return NextResponse.json(
        { error: "Flight number is required" },
        { status: 400 }
      );
    }

    const cacheKeyBase = normalized.replace(/\s/g, "");
    const cacheKeyParts = [cacheKeyBase];
    if (departureAirportIata) cacheKeyParts.push(departureAirportIata);
    if (flightDate) cacheKeyParts.push(flightDate);
    const cacheKey = cacheKeyParts.join(":");
      const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      const sessionId = request.headers.get("x-session-id") ?? "";
      if (sessionId) {
        insertSearch(sessionId, {
          flightNumber: cached.data.flightNumber ?? normalized,
          departureAirportIata: cached.data.departureAirportIata,
          arrivalAirportIata: cached.data.arrivalAirportIata,
          flightDate: flightDate || effectiveFlightDate,
        }).catch(() => {});
      }
      return NextResponse.json({ ...cached.data, flightDate: flightDate || effectiveFlightDate });
    }

    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (apiKey) {
      const flightIata = normalized.replace(/\s/g, "");
      const url = new URL("https://api.aviationstack.com/v1/flights");
      url.searchParams.set("access_key", apiKey);
      url.searchParams.set("flight_iata", flightIata);
      if (departureAirportIata) {
        url.searchParams.set("dep_iata", departureAirportIata);
      }
      // Request more results when we may need to filter (multiple same-day flights)
      const limit = departureAirportIata ? 5 : 10;
      url.searchParams.set("limit", String(limit));
      // Free tier does not support flight_date; we filter by date client-side.

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

      const flights: AviationStackFlight[] = Array.isArray(data?.data)
        ? data.data.filter((f: unknown): f is AviationStackFlight => f != null && typeof f === "object")
        : [];
      const selected = pickBestMatch(flights, normalized, flightDate, departureAirportIata);
      const mapped = selected ? parseSingleFlight(selected, normalized) : null;
      if (mapped) {
        cache.set(cacheKey, {
          data: mapped,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        const sessionId = request.headers.get("x-session-id") ?? "";
        if (sessionId) {
          insertSearch(sessionId, {
            flightNumber: mapped.flightNumber,
            departureAirportIata: mapped.departureAirportIata,
            arrivalAirportIata: mapped.arrivalAirportIata,
            flightDate: flightDate || effectiveFlightDate,
          }).catch(() => {});
        }
        return NextResponse.json({ ...mapped, flightDate: flightDate || effectiveFlightDate });
      }

      // Flights returned but none matched date/airport filter
      if (flights.length > 0) {
        return NextResponse.json(
          {
            error:
              "No flight matched your date or airport. Try adjusting your search or add your gate manually.",
          },
          { status: 404 }
        );
      }

      // API responded but no flight in result (e.g. not found or future flight)
      if (Array.isArray(data?.data) && data.data.length === 0) {
        return NextResponse.json(
          {
            error:
              "Flight not found or no live data. Try another flight number or add your gate manually after search.",
          },
          { status: 404 }
        );
      }
    }

    // Stub when no key or no API result.
    // For demos, respect user-provided departure airport/date so the local airport datasets (e.g. EWR Terminal C)
    // can drive recommendations and the map.
    const demoAirportIata = departureAirportIata || "JFK";
    const demoAirportNames: Record<string, string> = {
      EWR: "Newark Liberty International Airport",
      JFK: "John F Kennedy International Airport",
      LGA: "LaGuardia Airport",
      LAX: "Los Angeles International Airport",
      ORD: "Chicago O'Hare International Airport",
      RDU: "Raleigh-Durham International Airport",
    };
    const demoTerminalByAirport: Record<string, string> = {
      EWR: "Terminal C",
      JFK: "Terminal 4",
      LGA: "Terminal B",
      LAX: "Terminal B",
      ORD: "Terminal 3",
      RDU: "Terminal 2",
    };

    const demoTerminal = demoTerminalByAirport[demoAirportIata] ?? "Terminal 1";
    const terminalLetter = demoTerminal.replace(/^Terminal\s*/i, "").trim().toUpperCase();
    const numeric = (normalized.match(/\d+/g) ?? []).join("");
    const gateNumber = numeric ? ((Number.parseInt(numeric.slice(-2), 10) % 40) + 1) : 12;
    const demoGate = `${terminalLetter}${gateNumber}`;

    const sessionId = request.headers.get("x-session-id") ?? "";
    if (sessionId) {
      insertSearch(sessionId, {
        flightNumber: normalized,
        departureAirportIata: demoAirportIata,
        arrivalAirportIata: demoAirportIata === "EWR" ? "MIA" : "LAX",
        flightDate: flightDate || effectiveFlightDate,
      }).catch(() => {});
    }

    const stub: FlightData = {
      flightNumber: normalized,
      airline: demoAirportIata === "EWR" ? "United Airlines" : "American Airlines",
      departureAirportIata: demoAirportIata,
      departureAirportName: demoAirportNames[demoAirportIata] ?? `${demoAirportIata} Airport`,
      terminal: demoTerminal,
      gate: demoGate,
      boardingTime: "2:45 PM",
      minutesUntilBoarding: 40,
      status: "on_time",
      scheduledDepartureIso: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      scheduledArrivalIso: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      arrivalAirportIata: demoAirportIata === "EWR" ? "MIA" : "LAX",
      arrivalAirportName:
        demoAirportIata === "EWR"
          ? "Miami International Airport"
          : "Los Angeles International Airport",
      flightDurationMinutes: 180,
      flightDate: flightDate || effectiveFlightDate,
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
