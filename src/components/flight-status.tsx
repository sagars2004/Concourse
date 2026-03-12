"use client";

import { useState, useMemo, useEffect } from "react";
import { Plane, Clock, MapPin, Building2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConcourse } from "@/context/concourse-context";
import {
  getTimezoneForAirport,
  formatTimeInTimezone,
  formatFlightDuration,
  getTimezoneDisplayLabel,
  EASTERN_TIMEZONE,
  EST_OFFSET_HOURS,
  addHoursToIso,
} from "@/lib/airport-timezones";

export function FlightStatus() {
  const {
    flightData,
    gateOverride,
    terminalOverride,
    boardingTimeOverride,
    setGateOverride,
    setTerminalOverride,
    setBoardingTimeOverride,
    loadRecommendations,
    simulateGateChange,
  } = useConcourse();
  const [editingGate, setEditingGate] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(false);
  const [editingBoardingTime, setEditingBoardingTime] = useState(false);
  const [editGateValue, setEditGateValue] = useState("");
  const [editTerminalValue, setEditTerminalValue] = useState("");
  const [editBoardingTimeValue, setEditBoardingTimeValue] = useState("");

  if (!flightData) return null;

  const departureTz = useMemo(
    () => getTimezoneForAirport(flightData.departureAirportIata),
    [flightData.departureAirportIata]
  );
  const isEastern = departureTz === EASTERN_TIMEZONE;
  const departureTimeDisplay = useMemo(() => {
    if (flightData.scheduledDepartureIso) {
      const iso = isEastern ? addHoursToIso(flightData.scheduledDepartureIso, EST_OFFSET_HOURS) : flightData.scheduledDepartureIso;
      return formatTimeInTimezone(iso ?? flightData.scheduledDepartureIso, departureTz);
    }
    return "—";
  }, [flightData.scheduledDepartureIso, departureTz, isEastern]);
  const boardingTimeComputed = useMemo(() => {
    if (!flightData.scheduledDepartureIso) return "—";
    const dep = new Date(flightData.scheduledDepartureIso);
    const boarding = new Date(dep.getTime() - 35 * 60 * 1000);
    const iso = isEastern ? addHoursToIso(boarding.toISOString(), EST_OFFSET_HOURS) : boarding.toISOString();
    return formatTimeInTimezone(iso ?? boarding.toISOString(), departureTz);
  }, [flightData.scheduledDepartureIso, departureTz, isEastern]);
  const arrivalTimeDisplay = useMemo(() => {
    if (flightData.scheduledArrivalIso) {
      const arrTz = getTimezoneForAirport(flightData.arrivalAirportIata);
      const isArrivalEastern = arrTz === EASTERN_TIMEZONE;
      const iso = isArrivalEastern ? addHoursToIso(flightData.scheduledArrivalIso, EST_OFFSET_HOURS) : flightData.scheduledArrivalIso;
      return formatTimeInTimezone(iso ?? flightData.scheduledArrivalIso, arrTz);
    }
    return "—";
  }, [flightData.scheduledArrivalIso, flightData.arrivalAirportIata]);

  const timeZoneLabel = useMemo(() => getTimezoneDisplayLabel(departureTz), [departureTz]);
  const arrivalTz = useMemo(
    () => getTimezoneForAirport(flightData.arrivalAirportIata),
    [flightData.arrivalAirportIata]
  );
  const arrivalTimeZoneLabel = useMemo(() => getTimezoneDisplayLabel(arrivalTz), [arrivalTz]);

  const gate = gateOverride ?? flightData.gate ?? "—";
  const terminal = terminalOverride ?? flightData.terminal ?? "—";
  // When EST demo: prefer computed boarding time so +5h is applied; otherwise use API value
  const boardingTime =
    boardingTimeOverride ??
    (isEastern ? boardingTimeComputed : flightData.boardingTime) ??
    flightData.boardingTime ??
    boardingTimeComputed;
  // Countdown target: use the displayed boarding time (e.g. "7:05 AM") and subtract from now.
  // If a flight date is available, anchor the time to that date; otherwise treat it as today (or tomorrow if already passed).
  const boardingTargetMs = useMemo(() => {
    const label = (boardingTime ?? "").trim();
    if (!label || label === "—") return null;

    const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
    if (!match) return null;

    let hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    const ampm = match[3]?.toLowerCase();
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

    if (ampm) {
      const isPm = ampm === "pm";
      if (hour === 12) {
        hour = isPm ? 12 : 0;
      } else if (isPm) {
        hour += 12;
      }
    }

    const now = new Date();
    let target = new Date(now.getTime());

    if (flightData.flightDate) {
      const [y, m, d] = flightData.flightDate.split("-").map(Number);
      if (!y || !m || !d) return null;
      target.setFullYear(y, m - 1, d);
    }

    target.setSeconds(0, 0);
    target.setHours(hour, minute, 0, 0);

    // If no explicit flight date and the time has already passed today, assume it's tomorrow.
    if (!flightData.flightDate && target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime();
  }, [boardingTime, flightData.flightDate]);

  const [countdownRemainingMs, setCountdownRemainingMs] = useState<number>(() => {
    if (boardingTargetMs != null) return Math.max(0, boardingTargetMs - Date.now());
    return 0;
  });
  useEffect(() => {
    if (boardingTargetMs == null) return;
    const tick = () => {
      const remaining = Math.max(0, boardingTargetMs - Date.now());
      setCountdownRemainingMs(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [boardingTargetMs]);

  // Departure time (ms) for boarding-window check
  const departureMs = useMemo(
    () => (flightData.scheduledDepartureIso ? new Date(flightData.scheduledDepartureIso).getTime() : null),
    [flightData.scheduledDepartureIso]
  );
  const isInBoardingWindow = useMemo(() => {
    const now = Date.now();
    if (boardingTargetMs == null || departureMs == null) return false;
    return now >= boardingTargetMs && now < departureMs;
  }, [boardingTargetMs, departureMs, countdownRemainingMs]);

  // Countdown display: "12d : 15h: 38m : 30s" or "15h: 38m : 30s"
  const countdownHrMin = useMemo(() => {
    if (boardingTargetMs == null) return "—";
    if (countdownRemainingMs <= 0) return "00h: 00m : 00s";
    const totalSeconds = Math.floor(countdownRemainingMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const remainderSeconds = totalSeconds % (24 * 60 * 60);
    const hours = Math.floor(remainderSeconds / (60 * 60));
    const remainderMinutes = remainderSeconds % (60 * 60);
    const mins = Math.floor(remainderMinutes / 60);
    const secs = remainderMinutes % 60;
    if (days > 0) {
      return `${days}d : ${String(hours).padStart(2, "0")}h : ${String(mins).padStart(2, "0")}m : ${String(secs).padStart(2, "0")}s`;
    }
    return `${String(hours).padStart(2, "0")}h : ${String(mins).padStart(2, "0")}m : ${String(secs).padStart(2, "0")}s`;
  }, [countdownRemainingMs, boardingTargetMs]);

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
      <CardContent className="space-y-5">
        {/* Route graphic: origin • ——— duration ——— • destination */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            {/* Origin */}
            <div className="flex shrink-0 flex-col items-center gap-0.5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                {flightData.departureAirportIata ?? "—"}
              </div>
              <p className="text-xs font-semibold text-foreground">
                {flightData.departureAirportIata ?? "Origin"}
              </p>
              <p className="max-w-[72px] truncate text-[10px] text-muted-foreground" title={flightData.departureAirportName}>
                {flightData.departureAirportName?.replace(/\s*(International|Intl|Airport).*$/i, "").trim() || "—"}
              </p>
              <p className="text-sm font-semibold text-primary">{departureTimeDisplay}</p>
              <p className="text-[10px] text-muted-foreground">Departure{isEastern ? " (EST)" : ""}</p>
            </div>
            {/* Connecting line with flight time */}
            <div className="relative flex flex-1 items-center px-2">
              <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 shadow-sm">
                <Plane className="h-3.5 w-3.5 shrink-0 rotate-[-45deg] text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {formatFlightDuration(flightData.flightDurationMinutes)}
                </span>
              </div>
            </div>
            {/* Destination */}
            <div className="flex shrink-0 flex-col items-center gap-0.5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/80 text-sm font-bold text-primary-foreground shadow-sm">
                {flightData.arrivalAirportIata ?? "—"}
              </div>
              <p className="text-xs font-semibold text-foreground">
                {flightData.arrivalAirportIata ?? "Destination"}
              </p>
              <p className="max-w-[72px] truncate text-[10px] text-muted-foreground" title={flightData.arrivalAirportName}>
                {flightData.arrivalAirportName?.replace(/\s*(International|Intl|Airport).*$/i, "").trim() || "—"}
              </p>
              <p className="text-sm font-semibold text-primary">{arrivalTimeDisplay}</p>
              <p className="text-[10px] text-muted-foreground">
                Arrival{arrivalTz === EASTERN_TIMEZONE ? " (EST)" : arrivalTz !== departureTz ? ` (${arrivalTimeZoneLabel})` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Airline
            </p>
            <p className="font-medium text-foreground">
              {flightData.airline}
            </p>
          </div>
          {(flightData.departureAirportIata ?? flightData.departureAirportName) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Departure
              </p>
              <p
                className="font-medium text-foreground"
                title={flightData.departureAirportName}
              >
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
                    <p className="font-medium text-foreground">{terminal}</p>
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
                    <p className="font-medium text-foreground">{gate}</p>
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
              Departure time
            </p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-medium text-foreground">
                {departureTimeDisplay}
              </p>
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
                    <p className="font-medium text-foreground">
                      {boardingTime}
                    </p>
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
              Time until boarding
            </p>
            <div className="flex items-center gap-2">
              <p className="font-semibold tabular-nums">{countdownHrMin}</p>
            </div>
            {boardingTargetMs == null && (
              <p className="text-[10px] text-muted-foreground">
                Boarding time required for countdown
              </p>
            )}
          </div>
          {isInBoardingWindow && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <div className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2">
                <p className="text-lg font-semibold text-primary">Boarding now</p>
                <p className="text-[10px] text-muted-foreground">
                  Boarding in progress until departure at {departureTimeDisplay}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
