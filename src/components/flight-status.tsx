"use client";

import { useState } from "react";
import { Plane, Clock, MapPin, Building2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConcourse } from "@/context/concourse-context";

export function FlightStatus() {
  const { flightData, gateOverride, setGateOverride, simulateGateChange } = useConcourse();
  const [editingGate, setEditingGate] = useState(false);
  const [editValue, setEditValue] = useState("");

  if (!flightData) return null;

  const gate = gateOverride ?? flightData.gate ?? "—";
  const statusLabel =
    flightData.status === "on_time"
      ? "On Time"
      : flightData.status === "delayed"
        ? "Delayed"
        : "Cancelled";

  const startEdit = () => {
    setEditValue(gate === "—" ? "" : gate);
    setEditingGate(true);
  };

  const saveGate = () => {
    const v = editValue.trim();
    setGateOverride(v || null);
    setEditingGate(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          Flight {flightData.flightNumber}
        </CardTitle>
        <Badge
          variant={
            flightData.status === "on_time"
              ? "success"
              : flightData.status === "delayed"
                ? "warning"
                : "destructive"
          }
        >
          {statusLabel}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Airline
            </p>
            <p className="font-medium">{flightData.airline}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Terminal
            </p>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-medium">{flightData.terminal}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gate
            </p>
            <div className="flex items-center gap-2">
              {editingGate ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Gate"
                    className="h-8 w-20 text-sm"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={saveGate}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-medium">{gate}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-primary"
                    onClick={startEdit}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Boarding
            </p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-medium">
                {flightData.boardingTime}{" "}
                <span className="text-sm text-primary">
                  ({flightData.minutesUntilBoarding} min)
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => simulateGateChange()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Simulate gate change (demo)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
