import { NextResponse } from "next/server";
import type { FoodRecommendationItem } from "@/lib/types";
import { getAirportData } from "@/data/airports";
import type { AirportData, AirportVendor, AirportZone } from "@/data/airports";

const MOCK_RECOMMENDATIONS: FoodRecommendationItem[] = [
  {
    name: "Shake Shack",
    cuisine: "Burgers · American",
    walkTime: 4,
    roundTrip: 8,
    location: "Near Gate B14, Terminal 4",
    level: "green",
    opinion:
      "Best burger in T4, hands down. The ShackBurger is worth every second of that walk.",
    tags: ["Fast Casual", "Burgers"],
    dietaryTags: ["vegetarian"],
  },
  {
    name: "Panda Express",
    cuisine: "Chinese · Asian",
    walkTime: 6,
    roundTrip: 12,
    location: "Food Court, Terminal 4",
    level: "green",
    opinion:
      "Solid and reliable. The orange chicken hits different when you're in a rush.",
    tags: ["Quick Serve", "Chinese"],
    dietaryTags: [],
  },
  {
    name: "Blue Ribbon Sushi",
    cuisine: "Japanese · Sushi",
    walkTime: 9,
    roundTrip: 18,
    location: "Near Gate B22, Terminal 4",
    level: "yellow",
    opinion:
      "Excellent sushi for an airport, but you'll need to eat fast. Worth it if you're craving it.",
    tags: ["Sit Down", "Japanese", "Sushi"],
    dietaryTags: ["vegetarian", "gluten-free"],
  },
  {
    name: "Tigin Irish Pub",
    cuisine: "Irish · American",
    walkTime: 13,
    roundTrip: 26,
    location: "Near Gate B36, Terminal 4",
    level: "red",
    opinion:
      "Great fish and chips, but it's a hike. With only 40 min, I'd skip it this time.",
    tags: ["Sit Down", "Pub Food"],
    dietaryTags: ["vegetarian"],
  },
];

function levelFromWalkAndBoarding(
  roundTripMinutes: number,
  minutesUntilBoarding: number
): "green" | "yellow" | "red" {
  const buffer = minutesUntilBoarding - roundTripMinutes - 10;
  if (buffer >= 15) return "green";
  if (buffer >= 5) return "yellow";
  return "red";
}

function buildFromRag(
  airport: AirportData,
  minutesUntilBoarding: number
): FoodRecommendationItem[] {
  const zoneMap = new Map<string, AirportZone>(
    airport.zones.map((z) => [z.id, z])
  );

  return airport.vendors.map((v: AirportVendor) => {
    const zone = zoneMap.get(v.zoneId);
    const walkTime = zone?.walkMinutesFromB12 ?? 5;
    const roundTrip = walkTime * 2;
    const level = levelFromWalkAndBoarding(roundTrip, minutesUntilBoarding);
    return {
      name: v.name,
      cuisine: v.cuisine,
      walkTime,
      roundTrip,
      location: zone ? `${zone.name}, ${airport.terminal}` : airport.terminal,
      level,
      opinion: v.opinion,
      tags: v.tags,
      dietaryTags: v.dietaryTags,
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const terminal = typeof body?.terminal === "string" ? body.terminal : "";
    const departureAirportIata =
      typeof body?.departureAirportIata === "string" ? body.departureAirportIata : undefined;
    const _gate = body?.gate;
    const minutesUntilBoarding =
      typeof body?.minutesUntilBoarding === "number"
        ? body.minutesUntilBoarding
        : 40;
    const dietaryPreferences: string[] = Array.isArray(body?.dietaryPreferences)
      ? body.dietaryPreferences
      : [];

    let list: FoodRecommendationItem[];

    const airport = terminal
      ? getAirportData(terminal, departureAirportIata)
      : null;
    if (airport) {
      list = buildFromRag(airport, minutesUntilBoarding);
    } else {
      list = [...MOCK_RECOMMENDATIONS];
    }

    const hasRestriction =
      dietaryPreferences.length > 0 &&
      !dietaryPreferences.some((p) => p.toLowerCase() === "none");
    if (hasRestriction) {
      list = list.filter((rec) =>
        dietaryPreferences.some((pref) =>
          rec.dietaryTags
            .map((t) => t.toLowerCase())
            .includes(pref.toLowerCase())
        )
      );
    }
    if (list.length === 0) list = airport ? buildFromRag(airport, minutesUntilBoarding) : MOCK_RECOMMENDATIONS;

    return NextResponse.json({ recommendations: list });
  } catch (e) {
    console.error("Recommendations error:", e);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
