import { Sparkles } from "lucide-react";
import {
  FoodRecommendationCard,
  type FoodRecommendationProps,
} from "@/components/food-recommendation-card";

const mockRecommendations: FoodRecommendationProps[] = [
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
  },
];

export function FoodRecommendations() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Recommended For You</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {mockRecommendations.map((rec) => (
          <FoodRecommendationCard key={rec.name} {...rec} />
        ))}
      </div>
    </section>
  );
}
