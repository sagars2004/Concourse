/**
 * Preference filter categories for food recommendations.
 * Used by the UI (checkboxes), Supabase (persist), and recommendations/RAG (filter).
 */

export type DietaryId = "none" | "vegetarian" | "vegan" | "gluten-free" | "halal" | "kosher";

export const DIETARY_OPTIONS: { id: DietaryId; label: string }[] = [
  { id: "none", label: "No restrictions" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

export type CuisineId = "american" | "italian" | "mexican" | "asian" | "japanese" | "chinese" | "middle-eastern" | "indian" | "bakery" | "coffee" | "southern" | "latin" | "spanish";

export const CUISINE_OPTIONS: { id: CuisineId; label: string }[] = [
  { id: "american", label: "American" },
  { id: "italian", label: "Italian" },
  { id: "mexican", label: "Mexican" },
  { id: "asian", label: "Asian" },
  { id: "japanese", label: "Japanese" },
  { id: "chinese", label: "Chinese" },
  { id: "middle-eastern", label: "Middle Eastern" },
  { id: "bakery", label: "Bakery" },
  { id: "coffee", label: "Coffee & cafe" },
  { id: "southern", label: "Southern" },
  { id: "latin", label: "Latin" },
  { id: "spanish", label: "Spanish / Tapas" },
];

export type PriceId = "budget" | "mid" | "splurge";

export const PRICE_OPTIONS: { id: PriceId; label: string }[] = [
  { id: "budget", label: "Budget" },
  { id: "mid", label: "Mid-range" },
  { id: "splurge", label: "Splurge" },
];

export type ServiceId = "quick-serve" | "sit-down" | "bar" | "food-hall";

export const SERVICE_OPTIONS: { id: ServiceId; label: string }[] = [
  { id: "quick-serve", label: "Quick serve" },
  { id: "sit-down", label: "Sit-down" },
  { id: "bar", label: "Bar / drinks" },
  { id: "food-hall", label: "Food hall" },
];

export type MealId = "breakfast" | "lunch" | "dinner" | "anytime";

export const MEAL_OPTIONS: { id: MealId; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "anytime", label: "Anytime" },
];

export interface PreferenceFilters {
  dietary: string[];
  cuisine: string[];
  price: string[];
  service: string[];
  meal: string[];
}

export const DEFAULT_PREFERENCE_FILTERS: PreferenceFilters = {
  dietary: ["none"],
  cuisine: [],
  price: [],
  service: [],
  meal: [],
};

export function preferenceFiltersForAgent(f: PreferenceFilters): string {
  const parts: string[] = [];
  if (f.dietary.length > 0 && !f.dietary.includes("none")) {
    parts.push(`Dietary: ${f.dietary.join(", ")}`);
  }
  if (f.cuisine.length > 0) parts.push(`Cuisine: ${f.cuisine.join(", ")}`);
  if (f.price.length > 0) parts.push(`Price: ${f.price.join(", ")}`);
  if (f.service.length > 0) parts.push(`Service: ${f.service.join(", ")}`);
  if (f.meal.length > 0) parts.push(`Meal: ${f.meal.join(", ")}`);
  return parts.length === 0 ? "None specified." : parts.join(". ");
}
