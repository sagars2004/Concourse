/** IANA timezone for Eastern (US). Demo focuses on Northeast flights; times shown in ET. */
export const EASTERN_TIMEZONE = "America/New_York";

/** Display label for Eastern time (EST/EDT). */
export const EASTERN_TIME_LABEL = "Eastern Time (ET)";

/** Demo: add this many hours to times when displaying in ET. EDT uses +4 (UTC-4), EST uses +5 (UTC-5). */
export const EST_OFFSET_HOURS = 4;

/**
 * Add hours to an ISO date string. Used for demo to show times in Eastern (EDT +4h / EST +5h).
 */
export function addHoursToIso(isoString: string | undefined, hours: number): string | undefined {
  if (!isoString) return undefined;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return undefined;
  const out = new Date(date.getTime() + hours * 60 * 60 * 1000);
  return out.toISOString();
}

/**
 * IATA airport code → IANA timezone for formatting times in the departure/arrival airport.
 * Northeast US airports use Eastern; demo shows all times in ET and indicates it.
 */
export const AIRPORT_TIMEZONES: Record<string, string> = {
  // Northeast — Eastern Time (demo focus)
  JFK: EASTERN_TIMEZONE,
  LGA: EASTERN_TIMEZONE,
  EWR: EASTERN_TIMEZONE,
  BOS: EASTERN_TIMEZONE,
  PHL: EASTERN_TIMEZONE,
  BWI: EASTERN_TIMEZONE,
  DCA: EASTERN_TIMEZONE,
  IAD: EASTERN_TIMEZONE,
  ALB: EASTERN_TIMEZONE,
  BUF: EASTERN_TIMEZONE,
  SYR: EASTERN_TIMEZONE,
  PWM: EASTERN_TIMEZONE,
  // Southeast
  ATL: "America/New_York",
  MIA: "America/New_York",
  FLL: "America/New_York",
  MCO: "America/New_York",
  TPA: "America/New_York",
  CLT: "America/New_York",
  RDU: "America/New_York",
  BNA: "America/Chicago",
  RSW: "America/New_York",
  // Midwest
  ORD: "America/Chicago",
  MDW: "America/Chicago",
  DTW: "America/Detroit",
  MSP: "America/Chicago",
  STL: "America/Chicago",
  MCI: "America/Chicago",
  CLE: "America/New_York",
  CVG: "America/New_York",
  IND: "America/Indiana/Indianapolis",
  MIL: "Europe/Rome",
  // South
  DFW: "America/Chicago",
  IAH: "America/Chicago",
  AUS: "America/Chicago",
  SAT: "America/Chicago",
  DAL: "America/Chicago",
  MSY: "America/Chicago",
  OKC: "America/Chicago",
  // Mountain / West
  DEN: "America/Denver",
  PHX: "America/Phoenix",
  SLC: "America/Denver",
  ABQ: "America/Denver",
  // Pacific
  LAX: "America/Los_Angeles",
  SFO: "America/Los_Angeles",
  SAN: "America/Los_Angeles",
  SEA: "America/Los_Angeles",
  PDX: "America/Los_Angeles",
  SMF: "America/Los_Angeles",
  SJC: "America/Los_Angeles",
  OAK: "America/Los_Angeles",
  LAS: "America/Los_Angeles",
  // International (common)
  YYZ: "America/Toronto",
  YVR: "America/Vancouver",
  YUL: "America/Montreal",
  LHR: "Europe/London",
  CDG: "Europe/Paris",
  FRA: "Europe/Berlin",
  AMS: "Europe/Amsterdam",
  DUB: "Europe/Dublin",
  NRT: "Asia/Tokyo",
  HND: "Asia/Tokyo",
  ICN: "Asia/Seoul",
  SIN: "Asia/Singapore",
  HKG: "Asia/Hong_Kong",
  SYD: "Australia/Sydney",
};

/**
 * Get IANA timezone for an airport IATA code. Uses user's browser timezone as fallback if unknown.
 */
export function getTimezoneForAirport(iata: string | undefined): string {
  if (!iata) return Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tz = AIRPORT_TIMEZONES[iata.toUpperCase()];
  return tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Human-readable label for a timezone. For Northeast demo, Eastern is explicitly labeled "Eastern Time (ET)".
 */
export function getTimezoneDisplayLabel(timeZone: string): string {
  if (timeZone === EASTERN_TIMEZONE) return EASTERN_TIME_LABEL;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/**
 * Format an ISO date string in the given timezone. Returns localized time (e.g. "2:45 PM").
 */
export function formatTimeInTimezone(
  isoString: string | undefined,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }
): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(date);
  } catch {
    return "—";
  }
}

/**
 * Format flight duration minutes as "2h 30m".
 */
export function formatFlightDuration(minutes: number | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
