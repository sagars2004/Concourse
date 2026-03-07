"use client";

import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";

const preferences = [
  { id: "none", label: "No Restrictions" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

export function DietaryPreferences() {
  const [selected, setSelected] = useState<string[]>(["none"]);

  const togglePreference = (id: string) => {
    if (id === "none") {
      setSelected(["none"]);
      return;
    }

    setSelected((prev) => {
      const without = prev.filter((p) => p !== "none");
      if (without.includes(id)) {
        const result = without.filter((p) => p !== id);
        return result.length === 0 ? ["none"] : result;
      }
      return [...without, id];
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Dietary Preferences
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {preferences.map((pref) => {
          const isSelected = selected.includes(pref.id);
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
