"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConcourse } from "@/context/concourse-context";

export function HomeHero() {
  const router = useRouter();
  const { lookupFlight, step, error, setError } = useConcourse();

  const prevStepRef = useRef<string | null>(null);

  // Navigate to results only when we transition from loading → results (not when returning from results page)
  useEffect(() => {
    if (step === "results" && prevStepRef.current === "loading") {
      router.push("/results");
    }
    prevStepRef.current = step;
  }, [step, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const flightInput = form.querySelector<HTMLInputElement>('[name="flightNumber"]');
    const dateInput = form.querySelector<HTMLInputElement>('[name="flightDate"]');
    const airportInput = form.querySelector<HTMLInputElement>('[name="departureAirport"]');
    const flightNumber = flightInput?.value?.trim() ?? "";
    const date = dateInput?.value ?? "";
    const airport = airportInput?.value?.trim().toUpperCase() ?? "";

    if (!flightNumber || !date || !airport) {
      setError("Please enter your flight number, departure airport, and flight date.");
      return;
    }

    setError(null);
    lookupFlight(flightNumber, date, airport);
  };

  const isLoading = step === "loading";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 sm:px-6">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto w-full max-w-2xl">
        {/* Hero content */}
        <div className="mb-16 text-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
            <Plane className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Never miss your flight
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              chasing food again.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground sm:text-xl">
            Your AI-powered airport food concierge. Enter your flight number and
            we&apos;ll find the best eats near your gate.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <Plane className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="flightNumber"
                placeholder="e.g. AA 1234, UA 567"
                className="h-14 pl-12 text-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 gap-2 px-8 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span>Search</span>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Departure airport
              </label>
              <Input
                name="departureAirport"
                placeholder="e.g. DFW, JFK"
                className="h-11 text-sm uppercase"
                disabled={isLoading}
                maxLength={3}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Flight date
              </label>
              <Input
                name="flightDate"
                type="date"
                className="h-11 text-sm"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </form>

        {/* Loading overlay */}
        {isLoading && (
          <div className="mt-8 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Finding your flight and nearby food…</span>
          </div>
        )}
      </div>
    </div>
  );
}
