import { Map, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function TerminalMap() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Terminal Map</h2>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative flex h-64 flex-col items-center justify-center bg-card sm:h-80">
            {/* Grid pattern background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative flex flex-col items-center gap-4 text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary/50">
                <Navigation className="h-7 w-7 text-primary/40" />
              </div>
              <div className="space-y-1.5 text-center">
                <p className="text-sm font-medium text-foreground/60">
                  Interactive Terminal Map
                </p>
                <p className="text-xs text-muted-foreground">
                  Mapbox GL JS visualization coming soon
                </p>
                <p className="text-xs text-muted-foreground/50">
                  JFK Terminal 4 &middot; Gate B12 &rarr; Nearby Food Options
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
