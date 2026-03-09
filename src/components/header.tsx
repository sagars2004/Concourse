import Link from "next/link";
import { Plane } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Plane className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">Concourse</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <a
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            href="#"
          >
            Help
          </a>
        </nav>
      </div>
    </header>
  );
}
