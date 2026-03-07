import jfkT4 from "./jfk-terminal4.json";
import laxTb from "./lax-terminalb.json";
import ordT3 from "./ord-terminal3.json";

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
};

const terminalToKey: Record<string, string> = {
  "terminal 4": "jfk-terminal4",
  "t4": "jfk-terminal4",
  "terminal b": "lax-terminalb",
  "tb": "lax-terminalb",
  "terminal 3": "ord-terminal3",
  "t3": "ord-terminal3",
};

export function getAirportData(terminalLabel: string): AirportData | null {
  const normalized = terminalLabel.toLowerCase().trim();
  const key = terminalToKey[normalized] ?? normalized.replace(/\s+/g, "-");
  return airports[key] ?? null;
}

export { jfkT4, laxTb, ordT3 };
