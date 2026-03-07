"use client";

import { useState } from "react";
import { Plane, Clock, MapPin, Building2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConcourse } from "@/context/concourse-context";

export function FlightStatus() {
  const {
    flightData,
    gateOverride,
    terminalOverride,
    boardingTimeOverride,
    minutesUntilBoardingOverride,
    setGateOverride,
    setTerminalOverride,
    setBoardingTimeOverride,
    setMinutesUntilBoardingOverride,
    loadRecommendations,
    simulateGateChange,
  } = useConcourse();
  const [editingGate, setEditingGate] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(false);
  const [editingBoardingTime, setEditingBoardingTime] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [editGateValue, setEditGateValue] = useState("");
  const [editTerminalValue, setEditTerminalValue] = useState("");
  const [editBoardingTimeValue, setEditBoardingTimeValue] = useState("");
  const [editMinutesValue, setEditMinutesValue] = useState("");

  if (!flightData) return null;

  const gate = gateOverride ?? flightData.gate ?? "—";
  const terminal = terminalOverride ?? flightData.terminal ?? "—";
  const boardingTime = boardingTimeOverride ?? flightData.boardingTime ?? "—";
  const minutesUntilBoarding = minutesUntilBoardingOverride ?? flightData.minutesUntilBoarding ?? 40;
  const statusLabel =
    flightData.status === "on_time"
      ? "On Time"
      : flightData.status === "delayed"
        ? "Delayed"
        : "Cancelled";

  const startEditGate = () => {
    setEditGateValue(gate === "—" ? "" : gate);
    setEditingGate(true);
  };

  const saveGate = () => {
    const v = editGateValue.trim();
    setGateOverride(v || null);
    setEditingGate(false);
  };

  const startEditTerminal = () => {
    setEditTerminalValue(terminal === "—" ? "" : terminal.replace(/^Terminal\s+/i, ""));
    setEditingTerminal(true);
  };

  const saveTerminal = () => {
    const v = editTerminalValue.trim();
    const value = v ? (v.toLowerCase().startsWith("terminal") ? v : `Terminal ${v}`) : null;
    setTerminalOverride(value);
    setEditingTerminal(false);
    loadRecommendations(undefined, value, undefined);
  };

  const startEditBoardingTime = () => {
    setEditBoardingTimeValue(boardingTime === "—" ? "" : boardingTime);
    setEditingBoardingTime(true);
  };

  const saveBoardingTime = () => {
    const v = editBoardingTimeValue.trim();
    setBoardingTimeOverride(v || null);
    setEditingBoardingTime(false);
  };

  const startEditMinutes = () => {
    setEditMinutesValue(String(minutesUntilBoarding));
    setEditingMinutes(true);
  };

  const saveMinutes = () => {
    const n = parseInt(editMinutesValue, 10);
    const value = Number.isFinite(n) && n >= 0 ? n : null;
    setMinutesUntilBoardingOverride(value);
    setEditingMinutes(false);
    if (value !== null) loadRecommendations(undefined, undefined, value);
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
          {(flightData.departureAirportIata ?? flightData.departureAirportName) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Departure
              </p>
              <p className="font-medium" title={flightData.departureAirportName}>
                {flightData.departureAirportName ?? flightData.departureAirportIata}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Terminal
            </p>
            <div className="flex items-center gap-2">
              {editingTerminal ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTerminalValue}
                    onChange={(e) => setEditTerminalValue(e.target.value)}
                    placeholder="e.g. 4 or E"
                    className="h-8 w-24 text-sm"
                    autoFocus
                  />
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={saveTerminal}>
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-medium">{terminal}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={startEditTerminal}>
                    Edit
                  </Button>
                </>
              )}
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
                    value={editGateValue}
                    onChange={(e) => setEditGateValue(e.target.value)}
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
                    onClick={startEditGate}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Boarding time
            </p>
            <div className="flex items-center gap-2">
              {editingBoardingTime ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editBoardingTimeValue}
                    onChange={(e) => setEditBoardingTimeValue(e.target.value)}
                    placeholder="e.g. 7:05 AM"
                    className="h-8 w-28 text-sm"
                    autoFocus
                  />
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={saveBoardingTime}>
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-medium">{boardingTime}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={startEditBoardingTime}>
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Min until boarding
            </p>
            <div className="flex items-center gap-2">
              {editingMinutes ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={editMinutesValue}
                    onChange={(e) => setEditMinutesValue(e.target.value)}
                    placeholder="Minutes"
                    className="h-8 w-20 text-sm"
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={saveMinutes}>
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <p className="font-medium">{minutesUntilBoarding} min</p>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={startEditMinutes}>
                    Edit
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Correct these if your boarding pass differs.</p>
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
