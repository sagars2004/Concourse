"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const pathname = usePathname();
  const isResults = pathname?.startsWith("/results");
  const howItWorksHref = isResults
    ? "/how-it-works?from=results"
    : "/how-it-works?from=home";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-10">
        {/* Left: logo */}
        <div className="flex flex-1 items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Plane className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Concourse</span>
          </Link>
        </div>

        {/* Center: tagline */}
        <div className="hidden flex-1 justify-center text-center text-sm text-muted-foreground sm:flex">
          Built by Sagar Sahu for the DigitalOcean Gradient AI Hackathon
        </div>

        {/* Right: nav + theme */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <nav className="flex items-center gap-4">
            <Link
              href={howItWorksHref}
              className="text-sm text-muted-foreground underline underline-offset-4 decoration-1 transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
