"use client";

import { AlertTriangle, X } from "lucide-react";
import { useConcourse } from "@/context/concourse-context";

export function GateAlert() {
  const { gateChangeAlert, dismissGateAlert } = useConcourse();

  if (!gateChangeAlert?.visible) return null;

  return (
    <div className="w-full border-b border-warning/20 bg-warning/5">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            <span className="font-semibold">Gate Change: </span>
            {gateChangeAlert.message}
          </p>
        </div>
        <button
          onClick={dismissGateAlert}
          className="shrink-0 text-warning/60 transition-colors hover:text-warning"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
