"use client";

import { useState } from "react";
import { Route, Clock, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConcourse } from "@/context/concourse-context";

export function TripPlanner() {
  const { step, flightData, preferenceFilters } = useConcourse();
  const [nextAirport, setNextAirport] = useState("");
  const [layoverMinutes, setLayoverMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (step !== "results" || !flightData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPlan(null);
    setLoading(true);
    try {
      const layover = layoverMinutes.trim()
        ? Number.parseInt(layoverMinutes.trim(), 10)
        : undefined;
      const res = await fetch("/api/trip-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightData,
          nextAirportIata: nextAirport.trim().toUpperCase() || undefined,
          layoverMinutes: layover,
          preferenceFilters,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Trip plan failed");
      }
      setPlan(typeof data.plan === "string" ? data.plan : JSON.stringify(data));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong planning your trip."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Route className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Trip Planner (Beta)</h2>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="h-4 w-4 text-primary" />
            Plan food across your journey
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Start with your current flight, then optionally add a connection so Concourse can suggest a meal at each stop.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Next airport (connection) – IATA
                </label>
                <Input
                  placeholder="e.g. LAX, ORD"
                  value={nextAirport}
                  onChange={(e) => setNextAirport(e.target.value.toUpperCase().slice(0, 3))}
                  className="h-9 text-sm uppercase"
                  maxLength={3}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Layover minutes at next airport
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="e.g. 60"
                    value={layoverMinutes}
                    onChange={(e) => setLayoverMinutes(e.target.value.replace(/[^0-9]/g, ""))}
                    className="h-9 pl-7 text-sm"
                    disabled={loading}
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Planning your trip…" : "Plan my trip"}
              </Button>
            </div>
          </form>

          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}

          {plan && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Route className="h-3.5 w-3.5 text-primary" />
                <span>Concourse says:</span>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground whitespace-pre-line">
                {plan}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

