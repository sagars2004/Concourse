"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import createGlobe from "cobe";
import { IconBrandYoutubeFilled } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function FeaturesSectionWithBentoGrid() {
  const features = [
    {
      title: "Track issues effectively",
      description:
        "Track and manage your project issues with ease using our intuitive interface.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 md:col-span-4 lg:col-span-4 border-b md:border-r border-border/60",
    },
    {
      title: "Capture pictures with AI",
      description:
        "Capture stunning photos effortlessly using our advanced AI technology.",
      skeleton: <SkeletonTwo />,
      className:
        "col-span-1 md:col-span-2 lg:col-span-2 border-b border-border/60",
    },
    {
      title: "Watch our AI on YouTube",
      description:
        "Whether it’s you or Tyler Durden, you can get to know about our product on YouTube.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 md:col-span-3 lg:col-span-3 border-b md:border-r border-border/60",
    },
    {
      title: "Deploy in seconds",
      description:
        "With our blazing fast cloud services, you can deploy your model in seconds.",
      skeleton: <SkeletonFour />,
      className:
        "col-span-1 md:col-span-3 lg:col-span-3 border-b md:border-none border-border/60",
    },
  ];

  return (
    <section className="relative z-20 mx-auto max-w-7xl py-10 lg:py-24">
      <div className="px-4 sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-5xl text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-tight">
          Packed with thousands of features
        </h2>

        <p className="mx-auto my-4 max-w-2xl text-center text-sm font-normal text-muted-foreground sm:text-base">
          From image generation to video, Everything AI has APIs for almost
          everything. It can even create this website copy for you.
        </p>
      </div>

      <div className="relative mt-10 sm:mt-12">
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 rounded-2xl border border-border/70 bg-card/40 backdrop-blur-sm">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden p-4 sm:p-6 lg:p-8",
        "bg-background/40",
        className
      )}
    >
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="mx-auto max-w-5xl text-left text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "my-2 mx-0 max-w-sm text-left text-xs text-muted-foreground sm:text-sm md:text-xs lg:text-sm"
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex h-full gap-6 py-6">
      <div className="group mx-auto h-full w-full bg-background/80 p-4 shadow-xl sm:p-5">
        <div className="flex h-full w-full flex-1 flex-col space-y-3">
          <Image
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop"
            alt="Restaurant table with food"
            width={800}
            height={800}
            className="aspect-video h-full w-full rounded-lg object-cover object-center"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/50 to-transparent" />
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <Link
      href="https://www.youtube.com/watch?v=RPa3_AD1_Vs"
      target="_blank"
      className="group relative flex h-full gap-6"
    >
      <div className="group mx-auto h-full w-full bg-transparent">
        <div className="relative flex h-full w-full flex-1 flex-col space-y-2">
          <IconBrandYoutubeFilled className="absolute inset-0 z-10 m-auto h-16 w-16 text-red-500 drop-shadow-xl sm:h-20 sm:w-20" />
          <Image
            src="https://images.unsplash.com/photo-1516031190212-da133013de50?q=80&w=1600&auto=format&fit=crop"
            alt="Video preview"
            width={800}
            height={800}
            className="h-full w-full rounded-lg object-cover object-center transition-all duration-200 group-hover:blur-sm"
          />
        </div>
      </div>
    </Link>
  );
};

export const SkeletonTwo = () => {
  const images = [
    "https://images.unsplash.com/photo-1517322048670-4fba75cbbb62?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554931670-4ebfabf6e7a9?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546484475-7f7bd55792da?q=80&w=1200&auto=format&fit=crop",
  ];

  const imageVariants = {
    whileHover: {
      scale: 1.05,
      rotate: 0,
      zIndex: 10,
    },
    whileTap: {
      scale: 1.05,
      rotate: 0,
      zIndex: 10,
    },
  };

  return (
    <div className="relative flex h-full flex-col items-start gap-6 overflow-hidden p-4 sm:p-6">
      <div className="-ml-10 flex flex-row sm:-ml-16">
        {images.map((image, idx) => (
          <motion.div
            variants={imageVariants}
            key={`images-first-${idx}`}
            style={{
              rotate: Math.random() * 16 - 8,
            }}
            whileHover="whileHover"
            whileTap="whileTap"
            className="dark:border-neutral-700 flex-shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background/90 p-1 -mr-3"
          >
            <Image
              src={image}
              alt="food collage"
              width={500}
              height={500}
              className="h-20 w-20 flex-shrink-0 rounded-lg object-cover sm:h-28 sm:w-28 md:h-32 md:w-32"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row">
        {images.map((image, idx) => (
          <motion.div
            key={`images-second-${idx}`}
            style={{
              rotate: Math.random() * 16 - 8,
            }}
            variants={imageVariants}
            whileHover="whileHover"
            whileTap="whileTap"
            className="dark:border-neutral-700 flex-shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background/90 p-1 -mr-3"
          >
            <Image
              src={image}
              alt="food collage"
              width={500}
              height={500}
              className="h-20 w-20 flex-shrink-0 rounded-lg object-cover sm:h-28 sm:w-28 md:h-32 md:w-32"
            />
          </motion.div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-16 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-16 bg-gradient-to-l from-background via-background/80 to-transparent" />
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="relative mt-4 flex h-56 items-center justify-center bg-transparent sm:h-60 md:h-64">
      <CobeGlobe className="pointer-events-none" />
    </div>
  );
};

export const CobeGlobe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.02, 0.5, 0.9],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 260, height: 260, maxWidth: "100%", aspectRatio: 1 }}
      className={className}
    />
  );
};

