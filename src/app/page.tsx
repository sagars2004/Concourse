import { Header } from "@/components/header";
import { GateAlert } from "@/components/gate-alert";
import { FlightInput } from "@/components/flight-input";
import { FlightStatus } from "@/components/flight-status";
import { DietaryPreferences } from "@/components/dietary-preferences";
import { FoodRecommendations } from "@/components/food-recommendations";
import { TerminalMap } from "@/components/terminal-map";
import { ChatInterface } from "@/components/chat-interface";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <GateAlert />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <FlightInput />

          <div className="space-y-6">
            <FlightStatus />
            <DietaryPreferences />
          </div>

          <FoodRecommendations />
          <TerminalMap />
          <ChatInterface />
        </div>
      </main>

      <Footer />
    </div>
  );
}
