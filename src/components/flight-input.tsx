import { Search, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FlightInput() {
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
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="relative flex-1">
            <Plane className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Flight number (e.g. AA 203)"
              className="h-12 pl-10 text-base"
              defaultValue="AA 203"
            />
          </div>
          <Button size="lg" className="h-12 gap-2 px-6">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
