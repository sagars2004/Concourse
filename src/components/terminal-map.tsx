"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { Map, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useConcourse } from "@/context/concourse-context";
import { getTerminalMapData } from "@/data/airports/map-coordinates";

const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

function getMapboxToken(): string {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
}

export function TerminalMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);
  const { flightData, gateOverride, terminalOverride, recommendations, step } = useConcourse();

  const mapboxToken = getMapboxToken();
  const terminal = terminalOverride ?? flightData?.terminal ?? "";
  const gate = gateOverride ?? flightData?.gate ?? "B12";
  const airportIata = flightData?.departureAirportIata ?? null;

  useEffect(() => {
    if (step !== "results" || !flightData || !mapboxToken || !containerRef.current) {
      setReady(true);
      return;
    }

    const vendorNames = recommendations.slice(0, 4).map((r) => r.name);
    const mapData = getTerminalMapData(terminal, gate, vendorNames, airportIata);

    if (!mapData) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let map: import("mapbox-gl").Map | null = null;

    import("mapbox-gl").then((mapboxglMod) => {
      if (cancelled || !containerRef.current) return;

      const mapboxgl = (mapboxglMod as { default?: unknown }).default ?? mapboxglMod;
      const MapboxGL = mapboxgl as typeof import("mapbox-gl");
      (MapboxGL as unknown as { accessToken: string }).accessToken = mapboxToken;

      map = new MapboxGL.Map({
        container: containerRef.current,
        style: DARK_STYLE,
        center: mapData.center,
        zoom: mapData.zoom,
      });

      map.addControl(new MapboxGL.NavigationControl(), "top-right");

      map.on("load", () => {
        if (!map || cancelled) return;

        mapData.points.forEach((pt) => {
          const el = document.createElement("div");
          el.className = "terminal-marker";
          el.style.width = "20px";
          el.style.height = "20px";
          el.style.borderRadius = "50%";
          el.style.background =
            pt.type === "gate"
              ? "#38bdf8"
              : pt.level === "green"
                ? "#22c55e"
                : pt.level === "yellow"
                  ? "#eab308"
                  : "#ef4444";
          el.style.border = "2px solid #0c1222";
          el.style.cursor = "pointer";

          const popupHtml = `<div style="padding: 6px 10px; font-size: 14px; font-weight: 600; color: #f1f5f9; background: #1e293b; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${pt.label}</div>`;
          const popup = new MapboxGL.Popup({
            offset: 12,
            closeButton: false,
            closeOnClick: false,
          })
            .setHTML(popupHtml)
            .setLngLat([pt.lng, pt.lat]);

          const marker = new MapboxGL.Marker({ element: el })
            .setLngLat([pt.lng, pt.lat])
            .setPopup(popup)
            .addTo(map!);

          el.addEventListener("mouseenter", () => {
            popup.setLngLat([pt.lng, pt.lat]).addTo(map!);
          });
          el.addEventListener("mouseleave", () => {
            popup.remove();
          });
        });

        // Intentionally no path/route line between nodes (markers only).

        mapRef.current = map;
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, [step, flightData, recommendations, terminal, gate, airportIata, mapboxToken]);

  if (step !== "results") return null;

  const hasToken = !!mapboxToken;
  const hasFlight = !!flightData;
  const vendorNamesForMap = recommendations.slice(0, 4).map((r) => r.name);
  const mapDataForRender = hasFlight && hasToken
    ? getTerminalMapData(terminal, gate, vendorNamesForMap, airportIata)
    : null;
  const hasMapData = !!mapDataForRender;

  if (!hasToken || !hasFlight) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Terminal Map</h2>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative flex h-64 flex-col items-center justify-center bg-card sm:h-80">
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
                    {!hasToken
                      ? "Add NEXT_PUBLIC_MAPBOX_TOKEN to .env to enable the map."
                      : "Complete your flight search to see your gate and nearby food."}
                  </p>
                  <p className="text-xs text-muted-foreground/50">
                    {flightData
                      ? `${flightData.terminal} · Gate ${flightData.gate ?? "—"} → Nearby food`
                      : "Your gate and nearby food options"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (hasFlight && hasToken && !hasMapData) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Terminal Map</h2>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative flex h-64 flex-col items-center justify-center bg-card sm:h-80">
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
                    Map not available for this airport
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maps are available for 50+ airports (e.g. EWR, LGA, ALB, BOS, PHL, ATL, MIA, ORD, LAX). Your flight is from {flightData?.departureAirportName ?? airportIata ?? "an airport we don’t have yet"}.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Terminal Map</h2>
        </div>
        <p className="text-xs text-muted-foreground">Schematic — gate and food locations are approximate.</p>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="relative p-0">
          <div
            ref={containerRef}
            className="h-64 w-full bg-card sm:h-80"
            style={{ minHeight: 256 }}
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80">
              <p className="text-sm text-muted-foreground">Loading map…</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
