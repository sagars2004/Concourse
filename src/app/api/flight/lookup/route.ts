import { NextResponse } from "next/server";
import type { FlightData } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const flightNumber = (body?.flightNumber ?? body?.flight_number ?? "").toString().trim();
    const normalized = flightNumber.replace(/\s+/g, " ").toUpperCase();

    if (!normalized) {
      return NextResponse.json(
        { error: "Flight number is required" },
        { status: 400 }
      );
    }

    // Stub: return mock flight data. Replace with AviationStack in Phase 2.
    const mock: FlightData = {
      flightNumber: normalized,
      airline: "American Airlines",
      terminal: "Terminal 4",
      gate: "B12",
      boardingTime: "2:45 PM",
      minutesUntilBoarding: 40,
      status: "on_time",
    };

    return NextResponse.json(mock);
  } catch {
    return NextResponse.json(
      { error: "Failed to lookup flight" },
      { status: 500 }
    );
  }
}
