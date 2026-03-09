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
  const { recommendations, step, sendChatMessage } = useConcourse();

  const handleFeelingLucky = () => {
    if (!recommendations.length) return;
    const prompt =
      "I'm feeling lucky. Based on my current airport, terminal, time until boarding, and everything you know in your food knowledge base, surprise me with exactly ONE place to eat and sell me on it. Do not list multiple options—just pick one and explain why it's the best move right now.";
    sendChatMessage(prompt);
    const chatSection = document.getElementById("concourse-chat");
    if (chatSection) {
      chatSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Recommended For You</h2>
        </div>
        <button
          type="button"
          onClick={handleFeelingLucky}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          I&apos;m feeling lucky
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {recommendations.map((rec) => (
          <FoodRecommendationCard key={rec.name} {...toCardProps(rec)} />
        ))}
      </div>
    </section>
  );
}
