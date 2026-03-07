"use client";

import { useEffect } from "react";
import { UtensilsCrossed } from "lucide-react";
import { useConcourse } from "@/context/concourse-context";

const PREFERENCE_OPTIONS = [
  { id: "none", label: "No Restrictions" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

export function DietaryPreferences() {
  const {
    dietaryPreferences,
    setDietaryPreferences,
    savePreferences,
    loadRecommendations,
    sessionId,
    step,
  } = useConcourse();

  // Load preferences from API on mount when we have a session
  useEffect(() => {
    if (!sessionId || step !== "results") return;
    fetch("/api/preferences", { headers: { "x-session-id": sessionId } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.dietaryPreferences) && data.dietaryPreferences.length > 0) {
          setDietaryPreferences(data.dietaryPreferences);
        }
      })
      .catch(() => {});
  }, [sessionId, step, setDietaryPreferences]);

  const togglePreference = (id: string) => {
    let next: string[];
    if (id === "none") {
      next = ["none"];
    } else {
      const without = dietaryPreferences.filter((p) => p !== "none");
      if (without.includes(id)) {
        const result = without.filter((p) => p !== id);
        next = result.length === 0 ? ["none"] : result;
      } else {
        next = [...without, id];
      }
    }
    setDietaryPreferences(next);
    savePreferences(next).then(() => {
      loadRecommendations(next);
    });
  };

  if (step !== "results") return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Dietary Preferences
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {PREFERENCE_OPTIONS.map((pref) => {
          const isSelected = dietaryPreferences.includes(pref.id);
          return (
            <button
              key={pref.id}
              onClick={() => togglePreference(pref.id)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {pref.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
