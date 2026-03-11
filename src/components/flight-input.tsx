"use client";

import { useState } from "react";
import { Search, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConcourse } from "@/context/concourse-context";

export function FlightInput() {
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [airport, setAirport] = useState("");
  const { lookupFlight, step } = useConcourse();
  const [flightError, setFlightError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setFlightError(true);
      return;
    }
    setFlightError(false);
    lookupFlight(value, date || undefined, airport ? airport.trim().toUpperCase() : undefined);
  };

  return (
    <section className="py-12 sm:py-16 text-center">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Never miss your flight
            <br />
            <span className="text-primary">chasing food again.</span>
          </h1>
          <p className="mx-auto max-w-lg text-base text-muted-foreground sm:text-lg">
            Your AI-powered airport food concierge. Enter your flight number and
            let Concourse find the best eats near your gate.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          noValidate
          className="mx-auto flex max-w-md flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Plane className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Please enter your flight number"
                className={`h-12 pl-10 text-base border ${
                  flightError ? "border-destructive ring-1 ring-destructive/60" : "border-border"
                }`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={step === "loading"}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 gap-2 px-6"
              disabled={step === "loading"}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1 text-left text-sm text-muted-foreground">
              <label className="text-xs font-medium uppercase tracking-wide">
                Departure airport <span className="normal-case font-normal">(optional)</span>
              </label>
              <Input
                placeholder="e.g. DFW, JFK"
                className="h-10 text-sm uppercase"
                value={airport}
                onChange={(e) => setAirport(e.target.value.toUpperCase().slice(0, 3))}
                disabled={step === "loading"}
                maxLength={3}
                autoComplete="off"
              />
              <p className="text-xs">
                Helps when the same flight number operates from multiple airports.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-left text-sm text-muted-foreground">
              <label className="text-xs font-medium uppercase tracking-wide">
                Flight date
              </label>
              <Input
                type="date"
                className="h-10 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={step === "loading"}
                autoComplete="off"
              />
              <p className="text-xs">
                When you&apos;re flying. Helps pick the right trip when there are multiple.
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
