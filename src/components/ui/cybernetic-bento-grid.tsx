"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoItemProps {
  className?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

interface CyberneticBentoGridProps {
  className?: string;
  children: ReactNode;
}

interface MouseStyle extends CSSProperties {
  "--mouse-x": string;
  "--mouse-y": string;
}

export function BentoItem({
  className,
  title,
  description,
  icon,
  children,
}: BentoItemProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      item.style.setProperty("--mouse-x", `${x}px`);
      item.style.setProperty("--mouse-y", `${y}px`);
    };

    item.addEventListener("mousemove", handleMouseMove);
    return () => item.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={itemRef}
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        } as MouseStyle
      }
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--mouse-x) var(--mouse-y), rgba(56,189,248,0.2), transparent 40%)",
        }}
      />
      <div className="relative space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            {icon}
            <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
          </div>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

export function CyberneticBentoGrid({
  className,
  children,
}: CyberneticBentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 lg:grid-cols-6 lg:auto-rows-[minmax(220px,auto)]",
        className
      )}
    >
      {children}
    </div>
  );
}
