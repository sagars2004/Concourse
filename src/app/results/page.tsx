"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plane,
  SlidersHorizontal,
  UtensilsCrossed,
  Map,
  Route,
  MessageSquare,
} from "lucide-react";
import { Header } from "@/components/header";
import { GateAlert } from "@/components/gate-alert";
import { ErrorBanner } from "@/components/error-banner";
import { Button } from "@/components/ui/button";
import { FlightStatus } from "@/components/flight-status";
import { PreferenceFiltersSection } from "@/components/preference-filters";
import { FoodRecommendations } from "@/components/food-recommendations";
import { TerminalMap } from "@/components/terminal-map";
import { ChatInterface } from "@/components/chat-interface";
import { TripPlanner } from "@/components/trip-planner";
import { Footer } from "@/components/footer";
import {
  BentoItem,
  CyberneticBentoGrid,
} from "@/components/ui/cybernetic-bento-grid";
import { useConcourse } from "@/context/concourse-context";

export default function ResultsPage() {
  const router = useRouter();
  const { step, flightData, error, setError, clearResults } = useConcourse();

  // Redirect to home if no flight data
  useEffect(() => {
    if (step !== "loading" && !flightData) {
      router.replace("/");
    }
  }, [step, flightData, router]);

  const handleNewSearch = () => {
    clearResults();
    router.push("/");
  };

  if (!flightData && step !== "loading") {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}
      <GateAlert />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <div className="flex items-center justify-between pt-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to search
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSearch}
              className="gap-2"
            >
              New search
            </Button>
          </div>

          <CyberneticBentoGrid>
            <BentoItem
              className="lg:col-span-3 lg:row-span-2"
              title="Flight info"
              description="Live flight status, gate, terminal, and boarding countdown."
              icon={<Plane className="h-4 w-4 text-primary" />}
            >
              <FlightStatus />
            </BentoItem>

            <BentoItem
              className="lg:col-span-3"
              title="Preference filters"
              description="Tune dietary, cuisine, and service preferences."
              icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}
            >
              <PreferenceFiltersSection />
            </BentoItem>

            <BentoItem
              className="lg:col-span-3 lg:row-span-2"
              title="Recommended for you"
              description="Personalized options based on your gate and timing."
              icon={<UtensilsCrossed className="h-4 w-4 text-primary" />}
            >
              <FoodRecommendations />
            </BentoItem>

            <BentoItem
              className="lg:col-span-3 lg:row-span-2"
              title="Terminal map"
              description="Quick visual orientation near your departure area."
              icon={<Map className="h-4 w-4 text-primary" />}
            >
              <TerminalMap />
            </BentoItem>

            <BentoItem
              className="lg:col-span-3 lg:row-span-2"
              title="Trip planner"
              description="Plan pre-boarding steps with your available time."
              icon={<Route className="h-4 w-4 text-primary" />}
            >
              <TripPlanner />
            </BentoItem>

            <BentoItem
              className="lg:col-span-3 lg:row-span-2"
              title="Concourse chat"
              description="Ask follow-up questions about food, flights, and airport logistics."
              icon={<MessageSquare className="h-4 w-4 text-primary" />}
            >
              <ChatInterface />
            </BentoItem>
          </CyberneticBentoGrid>
        </div>
      </main>

      <Footer />
    </div>
  );
}
