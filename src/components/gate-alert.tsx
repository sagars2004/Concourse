"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function GateAlert() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="w-full border-b border-warning/20 bg-warning/5">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            <span className="font-semibold">Gate Change: </span>
            Your flight AA 203 has moved from Gate B12 to Gate B18.
            Recommendations updated!
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 text-warning/60 transition-colors hover:text-warning"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
