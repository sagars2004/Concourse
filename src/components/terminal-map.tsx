"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { Map, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useConcourse } from "@/context/concourse-context";
import { getTerminalMapData } from "@/data/airports/map-coordinates";

const MAPBOX_TOKEN = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "") : "";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export function TerminalMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);
  const { flightData, recommendations, step } = useConcourse();

  useEffect(() => {
    if (step !== "results" || !flightData || !MAPBOX_TOKEN || !containerRef.current) {
      setReady(true);
      return;
    }

    const gate = flightData.gate ?? "B12";
    const vendorNames = recommendations.slice(0, 4).map((r) => r.name);
    const mapData = getTerminalMapData(
      flightData.terminal,
      gate,
      vendorNames
    );

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
      (MapboxGL as unknown as { accessToken: string }).accessToken = MAPBOX_TOKEN;

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

          new MapboxGL.Marker({ element: el })
            .setLngLat([pt.lng, pt.lat])
            .setPopup(
              new MapboxGL.Popup({ offset: 12 }).setHTML(
                `<strong>${pt.label}</strong>`
              )
            )
            .addTo(map!);
        });

        if (mapData.route.length >= 2) {
          map!.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: mapData.route,
              },
            },
          });
          map!.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#38bdf8",
              "line-width": 3,
              "line-dasharray": [2, 1],
            },
          });
        }

        mapRef.current = map;
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, [step, flightData, recommendations]);

  if (step !== "results") return null;

  const hasToken = !!(
    typeof window !== "undefined" && process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  );
  const hasFlight = !!flightData;

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
                    {hasToken
                      ? "Set NEXT_PUBLIC_MAPBOX_TOKEN to show the map"
                      : "Mapbox GL JS — add NEXT_PUBLIC_MAPBOX_TOKEN to enable"}
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

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Terminal Map</h2>
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
