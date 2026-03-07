"use client";

import { Sparkles } from "lucide-react";
import { useConcourse } from "@/context/concourse-context";
import { FoodRecommendationCard } from "@/components/food-recommendation-card";
import { RecommendationsSkeleton } from "@/components/loading-skeleton";
import type { FoodRecommendationItem } from "@/lib/types";

function toCardProps(rec: FoodRecommendationItem) {
  return {
    name: rec.name,
    cuisine: rec.cuisine,
    walkTime: rec.walkTime,
    roundTrip: rec.roundTrip,
    location: rec.location,
    level: rec.level,
    opinion: rec.opinion,
    tags: rec.tags,
  };
}

export function FoodRecommendations() {
  const { recommendations, step } = useConcourse();

  if (step === "loading") {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recommended For You</h2>
        </div>
        <RecommendationsSkeleton />
      </section>
    );
  }

  if (step !== "results" || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Recommended For You</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {recommendations.map((rec) => (
          <FoodRecommendationCard key={rec.name} {...toCardProps(rec)} />
        ))}
      </div>
    </section>
  );
}
