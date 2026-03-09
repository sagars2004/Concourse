"use client";

import { useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`
              rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background
              ${isSelected
                ? "border-primary/60 bg-primary/15 text-primary shadow-sm"
                : "border-border/80 bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-muted/40 hover:text-foreground"
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          Your preferences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Refine what shows up in your recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FilterGroup label="Dietary">
            <FilterChips
              options={DIETARY_OPTIONS}
              selected={preferenceFilters.dietary}
              onToggle={toggleDietary}
              multi={false}
            />
          </FilterGroup>
          <FilterGroup label="Cuisine">
            <FilterChips
              options={CUISINE_OPTIONS}
              selected={preferenceFilters.cuisine}
              onToggle={toggleCuisine}
            />
          </FilterGroup>
          <FilterGroup label="Price">
            <FilterChips
              options={PRICE_OPTIONS}
              selected={preferenceFilters.price}
              onToggle={togglePrice}
            />
          </FilterGroup>
          <FilterGroup label="Service">
            <FilterChips
              options={SERVICE_OPTIONS}
              selected={preferenceFilters.service}
              onToggle={toggleService}
            />
          </FilterGroup>
          <FilterGroup label="Meal">
            <FilterChips
              options={MEAL_OPTIONS}
              selected={preferenceFilters.meal}
              onToggle={toggleMeal}
            />
          </FilterGroup>
        </div>
      </CardContent>
    </Card>
  );
}
