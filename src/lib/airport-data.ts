/**
 * Airport data loader: fetches from DigitalOcean Spaces when configured,
 * otherwise falls back to local JSON imports.
 */

import type { AirportData } from "@/data/airports";
import jfkT4 from "@/data/airports/jfk-terminal4.json";
import laxTb from "@/data/airports/lax-terminalb.json";
import ordT3 from "@/data/airports/ord-terminal3.json";
import lgaTb from "@/data/airports/lga-terminalb.json";
import ewrTc from "@/data/airports/ewr-terminalc.json";
import rduT2 from "@/data/airports/rdu-terminal2.json";

const LOCAL_AIRPORTS: Record<string, AirportData> = {
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

const SPACES_FILE_KEYS = [
  "jfk-terminal4",
  "lax-terminalb",
  "ord-terminal3",
  "lga-terminalb",
  "ewr-terminalc",
  "rdu-terminal2",
] as const;

/** Short keys (e.g. ewr-tc) map to the actual file name (ewr-terminalc.json). */
const KEY_TO_FILE: Record<string, string> = {
  "jfk-t4": "jfk-terminal4",
  "lax-tb": "lax-terminalb",
  "ord-t3": "ord-terminal3",
  "lga-tb": "lga-terminalb",
  "ewr-tc": "ewr-terminalc",
  "rdu-t2": "rdu-terminal2",
};

const cache = new Map<string, AirportData>();

function getSpacesBaseUrl(): string | null {
  const url =
    process.env.SPACES_AIRPORTS_BASE_URL ??
    process.env.NEXT_PUBLIC_SPACES_AIRPORTS_BASE_URL ??
    "";
  return url.replace(/\/$/, "") || null;
}

async function fetchFromSpaces(key: string): Promise<AirportData | null> {
  const base = getSpacesBaseUrl();
  if (!base) return null;
  const cached = cache.get(key);
  if (cached) return cached;
  const fileKey = KEY_TO_FILE[key] ?? key;
  try {
    const url = `${base}/${fileKey}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as AirportData;
    cache.set(key, data);
    if (fileKey === "jfk-terminal4") cache.set("jfk-t4", data);
    if (fileKey === "lax-terminalb") cache.set("lax-tb", data);
    if (fileKey === "ord-terminal3") cache.set("ord-t3", data);
    if (fileKey === "lga-terminalb") cache.set("lga-tb", data);
    if (fileKey === "ewr-terminalc") cache.set("ewr-tc", data);
    if (fileKey === "rdu-terminal2") cache.set("rdu-t2", data);
    return data;
  } catch {
    return null;
  }
}

function airportKeyFromIataAndTerminal(
  airportIata: string,
  terminal: string
): string | null {
  const iata = airportIata.toLowerCase().trim();
  let t = terminal.toLowerCase().replace(/^terminal\s*/i, "").trim();
  if (t === "t4") t = "4";
  if (t === "tb") t = "b";
  if (t === "t3") t = "3";
  if (t === "tc") t = "c";
  if (t === "t2") t = "2";
  const key = `${iata}-terminal${t}`;
  if (SPACES_FILE_KEYS.some((k) => k === key)) return key;
  const keyAlt = `${iata}-t${t}`;
  return KEY_TO_FILE[keyAlt] ?? (SPACES_FILE_KEYS.includes(keyAlt as (typeof SPACES_FILE_KEYS)[number]) ? keyAlt : null);
}

const terminalToKey: Record<string, string> = {
  "terminal 4": "jfk-terminal4",
  t4: "jfk-terminal4",
  "terminal b": "lax-terminalb",
  tb: "lax-terminalb",
  "terminal 3": "ord-terminal3",
  t3: "ord-terminal3",
};

/**
 * Resolve airport data: tries Spaces first (when configured), then local imports.
 */
export async function getAirportDataAsync(
  terminalLabel: string,
  airportIata?: string | null
): Promise<AirportData | null> {
  let key: string | null = null;

  if (airportIata) {
    const terminalPart =
      terminalLabel.replace(/^terminal\s*/i, "").trim() || terminalLabel;
    key = airportKeyFromIataAndTerminal(airportIata, terminalPart);
  } else {
    const normalized = terminalLabel.toLowerCase().trim();
    key = terminalToKey[normalized] ?? normalized.replace(/\s+/g, "-");
    if (!SPACES_FILE_KEYS.includes(key as (typeof SPACES_FILE_KEYS)[number])) {
      key = null;
    }
  }

  if (!key) return null;

  const fromSpaces = await fetchFromSpaces(key);
  if (fromSpaces) return fromSpaces;

  return LOCAL_AIRPORTS[key] ?? null;
}
