import { NextResponse } from "next/server";
import type { FoodRecommendationItem } from "@/lib/types";
import { getAirportDataAsync } from "@/lib/airport-data";
import type { AirportData, AirportVendor, AirportZone } from "@/data/airports";
import type { PreferenceFilters } from "@/lib/preference-filters";

const MOCK_RECOMMENDATIONS: FoodRecommendationItem[] = [
  {
    name: "Shake Shack",
    cuisine: "Burgers · American",
    walkTime: 4,
    roundTrip: 8,
    location: "Near Gate B14, Terminal 4",
    level: "green",
    opinion:
      "Best burger in T4, hands down. The ShackBurger is worth every second.",
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

  return airport.vendors
    .map((v: AirportVendor) => {
      const zone = zoneMap.get(v.zoneId);
      const walkTime = zone?.walkMinutesFromB12 ?? 5;
      const roundTrip = walkTime * 2;
      const wait = typeof v.avgWaitMinutes === "number" ? v.avgWaitMinutes : 7;
      const level = levelFromWalkAndBoarding(roundTrip + wait, minutesUntilBoarding);
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
    })
    .sort((a, b) => {
      const rank = (lvl: FoodRecommendationItem["level"]) =>
        lvl === "green" ? 0 : lvl === "yellow" ? 1 : 2;
      const r = rank(a.level) - rank(b.level);
      if (r !== 0) return r;
      if (a.walkTime !== b.walkTime) return a.walkTime - b.walkTime;
      return a.name.localeCompare(b.name);
    });
}

function parsePreferenceFilters(body: unknown): PreferenceFilters {
  const empty: PreferenceFilters = { dietary: [], cuisine: [], price: [], service: [], meal: [] };
  if (!body || typeof body !== "object") return empty;
  const o = body as Record<string, unknown>;
  const pf = o.preferenceFilters;
  if (pf && typeof pf === "object") {
    const p = pf as Record<string, unknown>;
    return {
      dietary: Array.isArray(p.dietary) ? (p.dietary as string[]) : empty.dietary,
      cuisine: Array.isArray(p.cuisine) ? (p.cuisine as string[]) : empty.cuisine,
      price: Array.isArray(p.price) ? (p.price as string[]) : empty.price,
      service: Array.isArray(p.service) ? (p.service as string[]) : empty.service,
      meal: Array.isArray(p.meal) ? (p.meal as string[]) : empty.meal,
    };
  }
  if (Array.isArray(o.dietaryPreferences)) {
    return { ...empty, dietary: o.dietaryPreferences as string[] };
  }
  return empty;
}

function applyPreferenceFilters(
  list: FoodRecommendationItem[],
  filters: PreferenceFilters,
  vendors: AirportVendor[]
): FoodRecommendationItem[] {
  const hasDietary =
    filters.dietary.length > 0 && !filters.dietary.some((p) => p.toLowerCase() === "none");
  const hasCuisine = filters.cuisine.length > 0;
  const hasPrice = filters.price.length > 0;
  const hasService = filters.service.length > 0;
  const hasMeal = filters.meal.length > 0;
  if (!hasDietary && !hasCuisine && !hasPrice && !hasService && !hasMeal) return list;

  const vendorMap = new Map(vendors.map((v) => [v.name, v]));
  return list.filter((rec) => {
    const vendor = vendorMap.get(rec.name);
    if (hasDietary && !filters.dietary.some((p) => rec.dietaryTags.map((t) => t.toLowerCase()).includes(p.toLowerCase())))
      return false;
    if (hasCuisine && vendor?.cuisineCategories?.length && !filters.cuisine.some((c) => vendor.cuisineCategories!.includes(c))) return false;
    if (hasPrice && vendor?.priceRange && !filters.price.includes(vendor.priceRange)) return false;
    if (hasService && vendor?.serviceType && !filters.service.includes(vendor.serviceType)) return false;
    if (hasMeal && vendor?.mealTypes?.length && !filters.meal.some((m) => vendor.mealTypes!.includes(m))) return false;
    return true;
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
    const preferenceFilters = parsePreferenceFilters(body);

    let list: FoodRecommendationItem[];
    let vendors: AirportVendor[] = [];

    const airport = terminal
      ? await getAirportDataAsync(terminal, departureAirportIata)
      : null;
    if (airport) {
      vendors = airport.vendors;
      list = buildFromRag(airport, minutesUntilBoarding);
    } else {
      list = [...MOCK_RECOMMENDATIONS];
    }

    list = applyPreferenceFilters(list, preferenceFilters, vendors);
    if (list.length === 0 && (preferenceFilters.dietary.length || preferenceFilters.cuisine.length || preferenceFilters.price.length || preferenceFilters.service.length || preferenceFilters.meal.length)) {
      list = airport ? buildFromRag(airport, minutesUntilBoarding) : [...MOCK_RECOMMENDATIONS];
    }

    return NextResponse.json({ recommendations: list });
  } catch (e) {
    console.error("Recommendations error:", e);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
