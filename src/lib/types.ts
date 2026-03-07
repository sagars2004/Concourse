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
