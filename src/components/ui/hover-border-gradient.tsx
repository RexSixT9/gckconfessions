"use client";

/**
 * HoverBorderGradient
 * Aceternity-inspired component: rotating conic-gradient border that expands
 * to fill the entire container on hover.
 *
 * Adapted to use the project's CSS design-token variables so it respects
 * both light and dark modes without any extra config.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export interface HoverBorderGradientProps
  extends React.HTMLAttributes<HTMLElement> {
  /** HTML element or component to render as the container. Default: "button". */
  as?: React.ElementType;
  containerClassName?: string;
  className?: string;
  /** Duration of one full gradient rotation in seconds. Default: 1 */
  duration?: number;
  /** Whether the rotating gradient is always visible, not just on hover. Default: false */
  automatic?: boolean;
  /** Clockwise = 1, Counter-clockwise = -1. Default: 1 */
  clockwise?: 1 | -1;
  children?: React.ReactNode;
}

export function HoverBorderGradient({
  as: Tag = "button",
  containerClassName = "",
  className = "",
  duration = 1,
  automatic = false,
  clockwise = 1,
  children,
  ...rest
}: HoverBorderGradientProps) {

  const [hovered, setHovered] = useState(false);
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const running = automatic || hovered;

  const tick = useCallback(
    (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = time - lastTimeRef.current;
        setAngle((prev) => (prev + clockwise * (delta / (duration * 1000)) * 360) % 360);
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(tick);
    },
    [clockwise, duration]
  );

  useEffect(() => {
    if (running) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [running, tick]);

  /**
   * The gradient itself.
   * Two stops for the "active" arc (the project's accent color),
   * the rest is a neutral dark/light background so only the border ring shows.
   */
  const gradient = `conic-gradient(
    from ${angle}deg,
    transparent              0deg,
    transparent            200deg,
    hsl(var(--accent) / 0.35) 240deg,
    hsl(var(--accent))       280deg,
    hsl(var(--accent) / 0.55) 320deg,
    transparent            360deg
  )`;

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      /* All other props (onClick, type, disabled, href, …) pass straight through */
      {...rest}
      className={[
        "relative inline-flex cursor-pointer select-none items-center justify-center",
        "rounded-[inherit] border-0 p-0",
        "focus-visible:outline-none",
        containerClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Gradient border layer ──────────────────────────────────── */}
      {/* Absolutely fills the container; the mask carves out the interior
          so only the 1.5px rim of the conic-gradient is visible. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-opacity duration-500"
        style={{
          padding: "1.5px",
          background: gradient,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          opacity: running ? 1 : 0,
        }}
      />

      {/* ── Static fallback border (shows when not hovered) ─────────── */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-opacity duration-500"
        style={{
          padding: "1px",
          background: "hsl(var(--border))",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          opacity: running ? 0 : 1,
        }}
      />

      {/* ── Subtle inner background glow while hovered ──────────────── */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--accent) / 0.07), transparent 70%)`,
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────── */}
      <span className={["relative z-10 rounded-[inherit]", className].filter(Boolean).join(" ")}>
        {children}
      </span>
    </Tag>
  );
}
