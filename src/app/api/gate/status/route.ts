import { NextRequest, NextResponse } from "next/server";

// Stub: return current gate. In Phase 6 we'll poll AviationStack or use demo trigger.
const MOCK_GATE = "B12";

export async function GET(request: NextRequest) {
  try {
    const flightNumber = request.nextUrl.searchParams.get("flightNumber") ?? "";
    const simulateChange = request.nextUrl.searchParams.get("simulateGateChange") === "true";

    const gate = simulateChange ? "B18" : MOCK_GATE;

    return NextResponse.json({
      gate,
      previousGate: simulateChange ? MOCK_GATE : null,
      changed: simulateChange,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to get gate status" },
      { status: 500 }
    );
  }
}
