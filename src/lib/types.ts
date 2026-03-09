export interface FlightData {
  flightNumber: string;
  airline: string;
  /** IATA code of departure airport (e.g. "JFK") — from AviationStack, used for correct terminal mapping */
  departureAirportIata?: string;
  /** Full name of departure airport — from AviationStack */
  departureAirportName?: string;
  terminal: string;
  gate: string | null;
  boardingTime: string;
  minutesUntilBoarding: number;
  status: "on_time" | "delayed" | "cancelled";
  /** ISO string for scheduled departure; used for timezone-aware display and route graphic */
  scheduledDepartureIso?: string;
  /** ISO string for scheduled arrival; used for duration and route graphic */
  scheduledArrivalIso?: string;
  /** IATA code of arrival airport */
  arrivalAirportIata?: string;
  /** Full name of arrival airport */
  arrivalAirportName?: string;
  /** Flight duration in minutes (from API or computed) */
  flightDurationMinutes?: number;
  /** User's search date YYYY-MM-DD; used to fix countdown when API returns a past time */
  flightDate?: string;
}

export interface FoodRecommendationItem {
  name: string;
  cuisine: string;
  walkTime: number;
  roundTrip: number;
  location: string;
  level: "green" | "yellow" | "red";
  opinion: string;
  tags: string[];
  dietaryTags: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
