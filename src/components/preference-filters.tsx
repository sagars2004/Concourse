"use client";

import { useEffect } from "react";
import { UtensilsCrossed } from "lucide-react";
import { useConcourse } from "@/context/concourse-context";
import type { PreferenceFilters } from "@/lib/preference-filters";
import {
  DIETARY_OPTIONS,
  CUISINE_OPTIONS,
  PRICE_OPTIONS,
  SERVICE_OPTIONS,
  MEAL_OPTIONS,
} from "@/lib/preference-filters";

function FilterChips<T extends string>({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: { id: T; label: string }[];
  selected: string[];
  onToggle: (id: T) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PreferenceFiltersSection() {
  const {
    preferenceFilters,
    setPreferenceFilters,
    savePreferences,
    loadRecommendations,
    sessionId,
    step,
  } = useConcourse();

  useEffect(() => {
    if (!sessionId || step !== "results") return;
    fetch("/api/preferences", { headers: { "x-session-id": sessionId } })
      .then((res) => res.json())
      .then((data) => {
        if (data.preferenceFilters && typeof data.preferenceFilters === "object") {
          const pf = data.preferenceFilters as Record<string, unknown>;
          setPreferenceFilters({
            dietary: Array.isArray(pf.dietary) ? (pf.dietary as string[]) : ["none"],
            cuisine: Array.isArray(pf.cuisine) ? (pf.cuisine as string[]) : [],
            price: Array.isArray(pf.price) ? (pf.price as string[]) : [],
            service: Array.isArray(pf.service) ? (pf.service as string[]) : [],
            meal: Array.isArray(pf.meal) ? (pf.meal as string[]) : [],
          });
        }
      })
      .catch(() => {});
  }, [sessionId, step, setPreferenceFilters]);

  const updateAndSave = (next: PreferenceFilters) => {
    setPreferenceFilters(next);
    savePreferences(next).then(() => loadRecommendations(next));
  };

  const toggleDietary = (id: string) => {
    let dietary: string[];
    if (id === "none") {
      dietary = ["none"];
    } else {
      const without = preferenceFilters.dietary.filter((p) => p !== "none");
      if (without.includes(id)) {
        const result = without.filter((p) => p !== id);
        dietary = result.length === 0 ? ["none"] : result;
      } else {
        dietary = [...without, id];
      }
    }
    updateAndSave({ ...preferenceFilters, dietary });
  };

  const toggleCuisine = (id: string) => {
    const next = preferenceFilters.cuisine.includes(id)
      ? preferenceFilters.cuisine.filter((c) => c !== id)
      : [...preferenceFilters.cuisine, id];
    updateAndSave({ ...preferenceFilters, cuisine: next });
  };

  const togglePrice = (id: string) => {
    const next = preferenceFilters.price.includes(id)
      ? preferenceFilters.price.filter((p) => p !== id)
      : [...preferenceFilters.price, id];
    updateAndSave({ ...preferenceFilters, price: next });
  };

  const toggleService = (id: string) => {
    const next = preferenceFilters.service.includes(id)
      ? preferenceFilters.service.filter((s) => s !== id)
      : [...preferenceFilters.service, id];
    updateAndSave({ ...preferenceFilters, service: next });
  };

  const toggleMeal = (id: string) => {
    const next = preferenceFilters.meal.includes(id)
      ? preferenceFilters.meal.filter((m) => m !== id)
      : [...preferenceFilters.meal, id];
    updateAndSave({ ...preferenceFilters, meal: next });
  };

  if (step !== "results") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Filter recommendations
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Dietary</p>
          <FilterChips
            options={DIETARY_OPTIONS}
            selected={preferenceFilters.dietary}
            onToggle={toggleDietary}
            multi={false}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Cuisine</p>
          <FilterChips
            options={CUISINE_OPTIONS}
            selected={preferenceFilters.cuisine}
            onToggle={toggleCuisine}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Price</p>
          <FilterChips
            options={PRICE_OPTIONS}
            selected={preferenceFilters.price}
            onToggle={togglePrice}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Service</p>
          <FilterChips
            options={SERVICE_OPTIONS}
            selected={preferenceFilters.service}
            onToggle={toggleService}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Meal</p>
          <FilterChips
            options={MEAL_OPTIONS}
            selected={preferenceFilters.meal}
            onToggle={toggleMeal}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Saved to your session and used by recommendations and the assistant (Supabase + DigitalOcean RAG).
      </p>
    </div>
  );
}
