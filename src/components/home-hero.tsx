"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConcourse } from "@/context/concourse-context";
import { DotGlobeHero } from "@/components/ui/globe-hero";

export function HomeHero() {
  const router = useRouter();
  const { lookupFlight, step, error, setError } = useConcourse();

  const prevStepRef = useRef<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    flight: false,
    airport: false,
    mm: false,
    dd: false,
    yyyy: false,
  });

  const fullHeadline = "Never miss your flight";
  const fullSubheadline = "chasing food again.";

  // Navigate to results only when we transition from loading → results (not when returning from results page)
  useEffect(() => {
    if (step === "results" && prevStepRef.current === "loading") {
      router.push("/results");
    }
    prevStepRef.current = step;
  }, [step, router]);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const total = fullHeadline.length + fullSubheadline.length;

    const animate = (now: number) => {
      const elapsed = now - start;
      const chars = Math.min(total, Math.floor(elapsed / 40));
      const headCount = Math.min(fullHeadline.length, chars);
      const subCount = Math.max(0, chars - fullHeadline.length);

      setHeadline(fullHeadline.slice(0, headCount));
      setSubheadline(fullSubheadline.slice(0, subCount));

      if (chars < total) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const flightInput = form.querySelector<HTMLInputElement>('[name="flightNumber"]');
    const mmInput = form.querySelector<HTMLInputElement>('[name="flightDateMM"]');
    const ddInput = form.querySelector<HTMLInputElement>('[name="flightDateDD"]');
    const yyyyInput = form.querySelector<HTMLInputElement>('[name="flightDateYYYY"]');
    const airportInput = form.querySelector<HTMLInputElement>('[name="departureAirport"]');
    const flightNumber = flightInput?.value?.trim() ?? "";
    const mmRaw = mmInput?.value?.trim() ?? "";
    const ddRaw = ddInput?.value?.trim() ?? "";
    const yyyyRaw = yyyyInput?.value?.trim() ?? "";
    const airport = airportInput?.value?.trim().toUpperCase() ?? "";

    const nextErrors = {
      flight: !flightNumber,
      airport: !airport,
      mm: !mmRaw,
      dd: !ddRaw,
      yyyy: !yyyyRaw,
    };
    setFieldErrors(nextErrors);

    if (nextErrors.flight || nextErrors.airport || nextErrors.mm || nextErrors.dd || nextErrors.yyyy) {
      setError("Please enter your flight number, departure airport, and flight date.");
      return;
    }

    const mm = Number.parseInt(mmRaw, 10);
    const dd = Number.parseInt(ddRaw, 10);
    const yyyy = Number.parseInt(yyyyRaw, 10);
    if (
      !Number.isFinite(mm) ||
      !Number.isFinite(dd) ||
      !Number.isFinite(yyyy) ||
      mm < 1 ||
      mm > 12 ||
      dd < 1 ||
      dd > 31 ||
      yyyy < 1900 ||
      yyyy > 2100
    ) {
      setError("Please enter a valid flight date (MM/DD/YYYY).");
      return;
    }
    const candidate = new Date(Date.UTC(yyyy, mm - 1, dd));
    if (
      candidate.getUTCFullYear() !== yyyy ||
      candidate.getUTCMonth() !== mm - 1 ||
      candidate.getUTCDate() !== dd
    ) {
      setError("Please enter a valid flight date (MM/DD/YYYY).");
      return;
    }
    const date = `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

    setError(null);
    lookupFlight(flightNumber, date, airport);
  };

  const isLoading = step === "loading";

  return (
    <DotGlobeHero
      rotationSpeed={0.0035}
      globeRadius={1.7}
      className="bg-gradient-to-br from-background via-background/95 to-muted/10"
    >
      <div className="relative w-full max-w-2xl px-4 text-center sm:px-0 lg:text-left">
        {/* Hero content */}
        <div className="mb-8 lg:mb-10">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Plane className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {headline}
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {subheadline}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg lg:mx-0">
            Your AI-powered airport food concierge. Enter your flight number and
            we&apos;ll find the best eats near your gate.
          </p>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          noValidate
          className="space-y-5 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 shadow-[0_0_50px_rgba(3,7,18,0.45)] backdrop-blur-md sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <Plane className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="flightNumber"
                placeholder="e.g. AA 1234, UA 567"
                className={`h-14 bg-background/70 pl-12 text-lg placeholder:text-muted-foreground border ${
                  fieldErrors.flight ? "border-destructive ring-1 ring-destructive/60" : "border-border/70"
                }`}
                disabled={isLoading}
                autoFocus
                autoComplete="off"
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
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Departure airport
              </label>
              <Input
                name="departureAirport"
                placeholder="e.g. DFW, JFK"
                className={`h-11 bg-background/70 text-sm uppercase placeholder:text-muted-foreground border ${
                  fieldErrors.airport ? "border-destructive ring-1 ring-destructive/60" : "border-border/70"
                }`}
                disabled={isLoading}
                maxLength={3}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Flight date
              </label>
              <div
                className={`flex h-11 items-center rounded-lg border bg-background/70 px-3 text-sm focus-within:ring-2 focus-within:ring-ring ${
                  isLoading ? "cursor-not-allowed opacity-50" : ""
                } ${
                  fieldErrors.mm || fieldErrors.dd || fieldErrors.yyyy
                    ? "border-destructive ring-1 ring-destructive/60"
                    : "border-border/70"
                }`}
              >
                <input
                  name="flightDateMM"
                  inputMode="numeric"
                  placeholder="MM"
                  maxLength={2}
                  disabled={isLoading}
                  className="w-10 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="Flight date month"
                  autoComplete="off"
                />
                <span className="px-1">/</span>
                <input
                  name="flightDateDD"
                  inputMode="numeric"
                  placeholder="DD"
                  maxLength={2}
                  disabled={isLoading}
                  className="w-10 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="Flight date day"
                  autoComplete="off"
                />
                <span className="px-1">/</span>
                <input
                  name="flightDateYYYY"
                  inputMode="numeric"
                  placeholder="YYYY"
                  maxLength={4}
                  disabled={isLoading}
                  className="w-14 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="Flight date year"
                  autoComplete="off"
                />
              </div>
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
          <div className="mt-6 flex items-center justify-center gap-3 text-muted-foreground lg:justify-start">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Finding your flight and nearby food…</span>
          </div>
        )}
      </div>
    </DotGlobeHero>
  );
}
