"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

const TEXTUREMAP = "https://i.postimg.cc/XYwvXN8D/img-4.png";
const DEPTHMAP = "https://i.postimg.cc/2SHKQh2q/raw-4.webp";

function FuturisticPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [colorMap, depthMap] = useTexture([TEXTUREMAP, DEPTHMAP]);

  useEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.minFilter = THREE.LinearFilter;
    colorMap.magFilter = THREE.LinearFilter;
    colorMap.generateMipmaps = true;
    colorMap.needsUpdate = true;

    depthMap.minFilter = THREE.LinearFilter;
    depthMap.magFilter = THREE.LinearFilter;
    depthMap.generateMipmaps = true;
    depthMap.needsUpdate = true;
  }, [colorMap, depthMap]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: colorMap },
      uDepth: { value: depthMap },
    }),
    [colorMap, depthMap]
  );

  useFrame((state) => {
    if (!materialRef.current || !meshRef.current) return;
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      Math.sin(t * 0.45) * 0.12,
      0.06
    );
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      Math.cos(t * 0.35) * 0.06,
      0.06
    );
  });

  return (
    <mesh ref={meshRef} scale={[4.8, 4.8, 1]}>
      <planeGeometry args={[1, 1, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        vertexShader={`
          uniform sampler2D uDepth;
          uniform float uTime;
          varying vec2 vUv;
          varying float vDepth;

          void main() {
            vUv = uv;
            float depth = texture2D(uDepth, uv).r;
            vDepth = depth;
            vec3 displaced = position;
            float driftX = sin((uv.y * 5.0) + (uTime * 0.7)) * 0.03;
            float driftY = cos((uv.x * 4.0) + (uTime * 0.55)) * 0.02;
            displaced.z += depth * 0.42;
            displaced.x += driftX * depth * 1.2;
            displaced.y += driftY * depth * 1.1;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform sampler2D uTexture;
          varying vec2 vUv;
          varying float vDepth;

          void main() {
            vec2 uv = vUv;
            float scan = smoothstep(0.0, 0.25, sin((uv.y * 12.0) - (uTime * 1.8)) * 0.5 + 0.5);
            vec4 tex = texture2D(uTexture, uv);
            vec3 cyanGlow = vec3(0.08, 0.65, 1.0) * (0.3 + vDepth * 0.8);
            vec3 redScan = vec3(0.85, 0.12, 0.22) * scan * 0.18;
            vec3 color = tex.rgb + cyanGlow + redScan;

            float edgeX = smoothstep(0.0, 0.2, uv.x) * smoothstep(0.0, 0.2, 1.0 - uv.x);
            float edgeY = smoothstep(0.0, 0.2, uv.y) * smoothstep(0.0, 0.2, 1.0 - uv.y);
            float edgeFade = edgeX * edgeY;
            float centerGlow = smoothstep(0.95, 0.15, distance(uv, vec2(0.5, 0.5)));
            float alpha = 0.92 * edgeFade * centerGlow;

            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

type HeroFuturisticProps = {
  children: React.ReactNode;
  className?: string;
};

export function HeroFuturistic({ children, className }: HeroFuturisticProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-none bg-[#020617] text-white",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.15),transparent_35%),linear-gradient(180deg,#020617_0%,#040b17_55%,#020617_100%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto grid h-full min-h-[calc(100vh-9rem)] max-w-7xl items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-8 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-20"
        >
          {children}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mx-auto flex h-[300px] w-full max-w-[620px] items-center justify-center sm:h-[360px] lg:h-[440px]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.14),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_55%,rgba(255,35,64,0.14),transparent_62%)] blur-2xl" />

          <div className="absolute -inset-8 [mask-image:radial-gradient(ellipse_at_center,black_46%,transparent_78%)]">
            <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.2], fov: 34 }}>
              <ambientLight intensity={1.1} />
              <pointLight position={[0, 1.5, 2]} intensity={2.1} color="#38bdf8" />
              <FuturisticPlane />
            </Canvas>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

