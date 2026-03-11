"use client";

import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

const CobeGlobe = ({
  className,
  rotationSpeed = 0.01,
}: {
  className?: string;
  rotationSpeed?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      // Use a square canvas so the sphere can be fully drawn
      width: 950,
      height: 950,
      phi: 0,
      theta: 0,
      // Larger globe, still fully visible inside the square container
      scale: 1.0,
      offset: [0, 0],
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.02, 0.5, 0.9],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // North America
        { location: [37.7749, -122.4194], size: 0.06 }, // San Francisco
        { location: [34.0522, -118.2437], size: 0.05 }, // Los Angeles
        { location: [40.7128, -74.006], size: 0.07 }, // New York
        { location: [41.8781, -87.6298], size: 0.04 }, // Chicago
        { location: [49.2827, -123.1207], size: 0.035 }, // Vancouver
        // Europe
        { location: [51.5074, -0.1278], size: 0.06 }, // London
        { location: [48.8566, 2.3522], size: 0.05 }, // Paris
        { location: [52.52, 13.405], size: 0.045 }, // Berlin
        { location: [41.9028, 12.4964], size: 0.04 }, // Rome
        { location: [40.4168, -3.7038], size: 0.04 }, // Madrid
        // Asia
        { location: [35.6762, 139.6503], size: 0.06 }, // Tokyo
        { location: [37.5665, 126.978], size: 0.05 }, // Seoul
        { location: [1.3521, 103.8198], size: 0.045 }, // Singapore
        { location: [28.6139, 77.209], size: 0.045 }, // Delhi
        { location: [13.7563, 100.5018], size: 0.04 }, // Bangkok
        // South America
        { location: [-23.5505, -46.6333], size: 0.05 }, // São Paulo
        { location: [-34.6037, -58.3816], size: 0.045 }, // Buenos Aires
        { location: [-12.0464, -77.0428], size: 0.04 }, // Lima
        // Oceania
        { location: [-33.8688, 151.2093], size: 0.05 }, // Sydney
        { location: [-37.8136, 144.9631], size: 0.045 }, // Melbourne
        // Africa & Middle East
        { location: [-1.2921, 36.8219], size: 0.04 }, // Nairobi
        { location: [30.0444, 31.2357], size: 0.045 }, // Cairo
        { location: [25.2048, 55.2708], size: 0.05 }, // Dubai
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += rotationSpeed;
      },
    });

    return () => {
      globe.destroy();
    };
  }, [rotationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        aspectRatio: 1,
      }}
      className={className}
    />
  );
};

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
  (
    {
      rotationSpeed = 0.0035,
      globeRadius = 1.7, // kept for API compatibility, not used directly
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-screen w-full overflow-hidden bg-background",
          className
        )}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-background via-background/95 to-muted/20" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
              {children}
            </div>

            <div className="order-1 relative flex w-full max-w-[560px] justify-self-center lg:order-2">
              <div className="relative w-full max-w-[460px] aspect-square overflow-hidden rounded-3xl">
                <CobeGlobe
                  rotationSpeed={rotationSpeed}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
