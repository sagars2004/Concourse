import { Plane } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Plane className="h-4 w-4" />
          <span className="text-sm">
            Concourse &mdash; Your AI Airport Food Concierge
          </span>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Built for the DigitalOcean Gradient AI Hackathon 2026
        </p>
      </div>
    </footer>
  );
}
