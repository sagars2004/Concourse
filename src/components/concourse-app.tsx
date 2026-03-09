"use client";

import { ConcourseProvider, useConcourse } from "@/context/concourse-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { Header } from "@/components/header";
import { GateAlert } from "@/components/gate-alert";
import { ErrorBanner } from "@/components/error-banner";
import { FlightInput } from "@/components/flight-input";
import { FlightStatus } from "@/components/flight-status";
import { FlightStatusSkeleton } from "@/components/loading-skeleton";
import { PreferenceFiltersSection } from "@/components/preference-filters";
import { FoodRecommendations } from "@/components/food-recommendations";
import { TerminalMap } from "@/components/terminal-map";
import { ChatInterface } from "@/components/chat-interface";
import { Footer } from "@/components/footer";

function ConcourseContent() {
  const { step, error, setError } = useConcourse();

  return (
    <>
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}
      <GateAlert />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <FlightInput />

          {step === "loading" && (
            <div className="space-y-6">
              <FlightStatusSkeleton />
              <FoodRecommendations />
            </div>
          )}

          {step === "results" && (
            <>
              <div className="space-y-6">
                <FlightStatus />
                <PreferenceFiltersSection />
              </div>
              <FoodRecommendations />
              <TerminalMap />
              <ChatInterface />
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export function ConcourseApp() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <ErrorBoundary>
        <ConcourseProvider>
          <ConcourseContent />
        </ConcourseProvider>
      </ErrorBoundary>
    </div>
  );
}
