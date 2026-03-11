"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

const DOT_COUNT = 64;

function DotPoint({ position }: { position: THREE.Vector3 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.02, 12, 12]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.9} />
    </mesh>
  );
}

const Globe: React.FC<{
  rotationSpeed: number;
  radius: number;
}> = ({ rotationSpeed, radius }) => {
  const groupRef = useRef<THREE.Group>(null!);

  const dots = useMemo(
    () => {
      const positions: THREE.Vector3[] = [];
      let seed = 42;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < DOT_COUNT; i++) {
        const u = rand();
        const v = rand();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = radius + 0.02;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        positions.push(new THREE.Vector3(x, y, z));
      }

      return positions;
    },
    [radius]
  );

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      const targetY = t * rotationSpeed;
      const targetX = Math.sin(t * 0.25) * rotationSpeed * 120;
      const targetZ = Math.cos(t * 0.18) * rotationSpeed * 80;

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetY,
        0.04
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        0.04
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetZ,
        0.04
      );
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
      {dots.map((position, idx) => (
        <DotPoint key={idx} position={position} />
      ))}
    </group>
  );
};

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
  (
    {
      rotationSpeed = 0.003,
      globeRadius = 1.4,
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

            <div className="order-1 relative h-[280px] w-full max-w-[560px] justify-self-center overflow-visible sm:h-[340px] lg:order-2 lg:h-[420px]">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25),transparent_68%)] blur-3xl" />
              <div className="pointer-events-none absolute -inset-10">
                <Canvas>
                  <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={75} />
                  <ambientLight intensity={0.7} />
                  <pointLight position={[6, 8, 6]} intensity={1.2} />

                  <Globe rotationSpeed={rotationSpeed} radius={globeRadius} />
                </Canvas>
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
