import { NextResponse } from "next/server";
import type { FlightData } from "@/lib/types";
import type { PreferenceFilters } from "@/lib/preference-filters";
import { preferenceFiltersForAgent } from "@/lib/preference-filters";
import { getGradientClient, tripPlannerChat } from "@/lib/gradient";
import { CONCOURSE_SYSTEM_PROMPT } from "@/lib/concourse-persona";

interface TripPlanRequest {
  flightData?: FlightData | null;
  nextAirportIata?: string;
  layoverMinutes?: number;
  preferenceFilters?: PreferenceFilters;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as TripPlanRequest;
    const flightData = body.flightData ?? null;
    const nextAirportIata = (body.nextAirportIata ?? "").trim().toUpperCase();
    const layoverMinutes =
      typeof body.layoverMinutes === "number" && Number.isFinite(body.layoverMinutes)
        ? body.layoverMinutes
        : undefined;
    const preferenceFilters = body.preferenceFilters;

    if (!flightData) {
      return NextResponse.json(
        { error: "Flight context is required for trip planning." },
        { status: 400 }
      );
    }

    const client = getGradientClient();
    const hasGradient = !!client;

    const origin = flightData.departureAirportIata ?? "origin airport";
    const originName = flightData.departureAirportName ?? origin;
    const terminal = flightData.terminal;
    const gate = flightData.gate ?? "TBD";
    const minutesUntilBoarding = flightData.minutesUntilBoarding ?? 40;
    const nextLeg =
      nextAirportIata && layoverMinutes
        ? ` Then they connect through ${nextAirportIata} with about ${layoverMinutes} minutes on the ground.`
        : "";

    const prefContext = preferenceFilters
      ? preferenceFiltersForAgent(preferenceFilters)
      : "";

    const tripPlannerSystemPrompt = [
      CONCOURSE_SYSTEM_PROMPT,
      "You are specifically handling trip planning across one or more airports (origin + optional connection).",
      "When you need food suggestions for a specific airport/terminal, use your tools/knowledge base rather than guessing.",
      "Return a short plan with clear headings per stop (Origin / Connection).",
    ].join("\n\n");

    const userPrompt = [
      "You are the Concourse Trip Planner.",
      `The traveler is currently at ${originName} (${origin}), ${terminal}, Gate ${gate}.`,
      `They have about ${minutesUntilBoarding} minutes until boarding.${nextLeg}`,
      "",
      "Plan a short, time-aware food journey:",
      "- If there is only this single leg, pick ONE place at the current airport and justify why it fits their time and situation.",
      "- If there is a connection specified, suggest one concise food stop at the origin and one at the connection airport.",
      "",
      "Keep the answer concise, structured, and practical. Focus on where to go and why, not on general airport trivia.",
    ].join(" ");

    if (hasGradient) {
      const content = await tripPlannerChat(
        [{ role: "user", content: userPrompt }],
        tripPlannerSystemPrompt,
        prefContext ? `Current user preferences: ${prefContext}` : undefined
      );
      return NextResponse.json({
        plan: content || "I couldn't build a trip plan right now. Try again in a moment.",
      });
    }

    const stubPlan = `At ${originName}, head toward a reliable quick-serve spot near your gate so you don't stress about time. For your connection${nextLeg ? " at your next airport" : ""}, aim for something close to your arrival gate with minimal wait times rather than a full sit-down meal.`;

    return NextResponse.json({ plan: stubPlan });
  } catch (e) {
    console.error("Trip plan error:", e);
    return NextResponse.json(
      { error: "Failed to create trip plan" },
      { status: 500 }
    );
  }
}

