import jfkT4 from "./jfk-terminal4.json";
import laxTb from "./lax-terminalb.json";
import ordT3 from "./ord-terminal3.json";
import lgaTb from "./lga-terminalb.json";
import ewrTc from "./ewr-terminalc.json";
import rduT2 from "./rdu-terminal2.json";

export interface AirportZone {
  id: string;
  name: string;
  walkMinutesFromB12: number;
}

export interface AirportVendor {
  name: string;
  cuisine: string;
  zoneId: string;
  dietaryTags: string[];
  tags: string[];
  avgWaitMinutes: number;
  opinion: string;
  /** For filtering: budget | mid | splurge. Used with preference filters and RAG. */
  priceRange?: "budget" | "mid" | "splurge";
  /** For filtering: quick-serve | sit-down | bar | food-hall. */
  serviceType?: string;
  /** For filtering: breakfast, lunch, dinner, anytime. */
  mealTypes?: string[];
  /** For filtering: american, italian, coffee, etc. Matches CUISINE_OPTIONS ids. */
  cuisineCategories?: string[];
  /** One-line description for RAG and display. */
  shortDescription?: string;
}

export interface AirportData {
  airport: string;
  terminal: string;
  description: string;
  zones: AirportZone[];
  vendors: AirportVendor[];
  tips: string;
}

const airports: Record<string, AirportData> = {
  "jfk-terminal4": jfkT4 as AirportData,
  "jfk-t4": jfkT4 as AirportData,
  "lax-terminalb": laxTb as AirportData,
  "lax-tb": laxTb as AirportData,
  "ord-terminal3": ordT3 as AirportData,
  "ord-t3": ordT3 as AirportData,
  "lga-terminalb": lgaTb as AirportData,
  "lga-tb": lgaTb as AirportData,
  "ewr-terminalc": ewrTc as AirportData,
  "ewr-tc": ewrTc as AirportData,
  "rdu-terminal2": rduT2 as AirportData,
  "rdu-t2": rduT2 as AirportData,
};

const terminalToKey: Record<string, string> = {
  "terminal 4": "jfk-terminal4",
  "t4": "jfk-terminal4",
  "terminal b": "lax-terminalb",
  "tb": "lax-terminalb",
  "terminal 3": "ord-terminal3",
  "t3": "ord-terminal3",
};

/** Build airport key from IATA + terminal for unambiguous lookup (e.g. "JFK" + "4" → "jfk-terminal4"). */
function airportKeyFromIataAndTerminal(airportIata: string, terminal: string): string | null {
  const iata = airportIata.toLowerCase().trim();
  const t = terminal.toLowerCase().replace(/^terminal\s*/i, "").trim();
  const key = `${iata}-terminal${t}`;
  if (airports[key]) return key;
  const keyAlt = `${iata}-t${t}`;
  return airports[keyAlt] ? keyAlt : null;
}

export function getAirportData(
  terminalLabel: string,
  airportIata?: string | null
): AirportData | null {
  if (airportIata) {
    const terminalPart = terminalLabel.replace(/^terminal\s*/i, "").trim() || terminalLabel;
    const key = airportKeyFromIataAndTerminal(airportIata, terminalPart);
    if (key) return airports[key];
  }
  const normalized = terminalLabel.toLowerCase().trim();
  const key = terminalToKey[normalized] ?? normalized.replace(/\s+/g, "-");
  return airports[key] ?? null;
}

export { jfkT4, laxTb, ordT3, lgaTb, ewrTc, rduT2 };
