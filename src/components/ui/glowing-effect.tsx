"use client";

import { useEffect, useRef, useCallback } from "react";
import { prefersReducedMotion, isTouchDevice } from "@/lib/motionConfig";

interface GlowingEffectProps {
  /** Size of the radial gradient in px — how far the glow fans out from the cursor */
  spread?: number;
  /** Whether the inner glow fill is shown in addition to the border glow */
  glow?: boolean;
  /** Whether the effect is disabled */
  disabled?: boolean;
  /** Distance in px outside the element at which the glow starts appearing */
  proximity?: number;
  /**
   * Fraction of the element's smaller dimension (0–1) treated as a dead zone
   * at the very centre. Keeps the border glow from looking washed-out when the
   * cursor moves to the middle of a large card.
   */
  inactiveZone?: number;
  /** Accent colour (CSS color string). Defaults to reading --accent from CSS variables */
  color?: string;
  /** Border radius applied to the glow layer (inherits from parent when omitted) */
  borderRadius?: string;
  /** Opacity multiplier when "active" (0–1) */
  maxOpacity?: number;
}

// ─── Global shared mouse state ─────────────────────────────────────────────
// Using a module-level set keeps every mounted GlowingEffect reusing the
// same single `mousemove` listener on the window, instead of N listeners.

type UpdateFn = (x: number, y: number) => void;
const _registry = new Set<UpdateFn>();
let _listenerAttached = false;

function registerEffect(fn: UpdateFn) {
  _registry.add(fn);
  if (!_listenerAttached) {
    _listenerAttached = true;
    window.addEventListener("mousemove", _onMove, { passive: true });
  }
}

function unregisterEffect(fn: UpdateFn) {
  _registry.delete(fn);
  if (_registry.size === 0) {
    _listenerAttached = false;
    window.removeEventListener("mousemove", _onMove);
  }
}

function _onMove(e: MouseEvent) {
  _registry.forEach((fn) => fn(e.clientX, e.clientY));
}

// ─── Component ─────────────────────────────────────────────────────────────

export function GlowingEffect({
  spread = 350,
  glow = true,
  disabled = false,
  proximity = 80,
  inactiveZone = 0.05,
  color,
  borderRadius,
  maxOpacity = 1,
}: GlowingEffectProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const applyGlow = useCallback(
    (clientX: number, clientY: number) => {
      const el = glowRef.current;
      if (!el) return;

      const parent = el.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();

      // ── Proximity check ────────────────────────────────────────────────────
      // Distance from the cursor to the nearest point on the element's border.
      const nearestX = Math.max(rect.left, Math.min(clientX, rect.right));
      const nearestY = Math.max(rect.top, Math.min(clientY, rect.bottom));
      const distanceToBorder = Math.hypot(clientX - nearestX, clientY - nearestY);

      if (distanceToBorder > proximity) {
        // Outside proximity — fade to zero
        el.style.opacity = "0";
        if (fillRef.current) fillRef.current.style.opacity = "0";
        return;
      }

      // ── Cursor position relative to element ───────────────────────────────
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // ── Inactive (dead) zone — centre of element ──────────────────────────
      const minDim = Math.min(rect.width, rect.height);
      const deadRadius = minDim * inactiveZone;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const distToCenter = Math.hypot(x - cx, y - cy);

      if (distToCenter < deadRadius) {
        el.style.opacity = "0";
        if (fillRef.current) fillRef.current.style.opacity = "0";
        return;
      }

      // ── Compute opacity based on distance ─────────────────────────────────
      // Full brightness once inside the element; ramp up over `proximity` px outside.
      const alpha =
        distanceToBorder === 0
          ? maxOpacity
          : maxOpacity * (1 - distanceToBorder / proximity);

      // ── Resolve accent colour ─────────────────────────────────────────────
      const resolvedColor =
        color ??
        `hsl(${getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim()})`;

      // ── Border glow ───────────────────────────────────────────────────────
      el.style.opacity = String(alpha);
      el.style.background = `radial-gradient(${spread}px circle at ${x}px ${y}px, ${resolvedColor}, transparent 60%)`;

      // ── Inner fill glow (soft, much lower opacity) ────────────────────────
      if (glow && fillRef.current) {
        fillRef.current.style.opacity = String(alpha * 0.08);
        fillRef.current.style.background = `radial-gradient(${spread * 0.8}px circle at ${x}px ${y}px, ${resolvedColor}, transparent 70%)`;
      }
    },
    [spread, glow, proximity, inactiveZone, color, maxOpacity]
  );

  useEffect(() => {
    if (disabled) return;

    // Check OS-level reduced-motion
    if (prefersReducedMotion()) return;
    // Skip on touch-only devices (no hover cursor)
    if (isTouchDevice()) return;

    let isMounted = true;

    const update: UpdateFn = (x, y) => {
      pendingRef.current = { x, y };
      if (rafRef.current !== null) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!isMounted || !pendingRef.current) return;
        applyGlow(pendingRef.current.x, pendingRef.current.y);
        pendingRef.current = null;
      });
    };

    registerEffect(update);

    return () => {
      isMounted = false;
      unregisterEffect(update);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [disabled, applyGlow]);

  if (disabled) return null;

  const br = borderRadius ?? "inherit";

  return (
    <>
      {/* Border glow layer: masked so only the 1px ring is visible */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-1 opacity-0 transition-opacity duration-300"
        style={{
          borderRadius: br,
          padding: "1px",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      />
      {/* Inner fill glow — very subtle background wash */}
      {glow && (
        <div
          ref={fillRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
        />
      )}
    </>
  );
}
