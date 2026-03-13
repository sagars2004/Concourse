"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useConcourse } from "@/context/concourse-context";
import { FoodRecommendationCard } from "@/components/food-recommendation-card";
import { RecommendationsSkeleton } from "@/components/loading-skeleton";
import { getOrCreateSessionId } from "@/lib/session";
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
  const { recommendations, step, sendChatMessage, flightData } = useConcourse();
  const shownSentRef = useRef(false);

  useEffect(() => {
    if (
      step !== "results" ||
      recommendations.length === 0 ||
      shownSentRef.current
    )
      return;
    shownSentRef.current = true;
    const sessionId = getOrCreateSessionId();
    fetch("/api/analytics/recommendation-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({
        action: "shown",
        vendors: recommendations.map((r) => ({
          name: r.name,
          terminal: flightData?.terminal ?? undefined,
          gate: flightData?.gate ?? undefined,
          level: r.level,
        })),
      }),
    }).catch(() => {});
  }, [step, recommendations, flightData?.terminal, flightData?.gate]);

  const handleVendorClick = (vendorName: string) => {
    const sessionId = getOrCreateSessionId();
    fetch("/api/analytics/recommendation-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ action: "clicked", vendorName }),
    }).catch(() => {});
  };

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {recommendations.map((rec) => (
          <div
            key={rec.name}
            role="button"
            tabIndex={0}
            onClick={() => handleVendorClick(rec.name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleVendorClick(rec.name);
              }
            }}
            className="h-full cursor-pointer"
          >
            <FoodRecommendationCard {...toCardProps(rec)} />
          </div>
        ))}
      </div>
    </section>
  );
}
