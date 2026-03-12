import { Plane } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-md py-6">
      <div className="flex w-full items-center justify-center px-4 text-sm text-muted-foreground sm:px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4" />
          <span>© 2026 Concourse. All Rights Reserved.</span>
        </div>
      </div>
    </footer>
  );
}
