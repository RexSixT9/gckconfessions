/**
 * GSAP animation utilities for Next.js App Router.
 *
 * Deliberately avoids @gsap/react to keep dependencies minimal.
 * Uses useLayoutEffect so GSAP sets initial states before the browser paints,
 * preventing flashes of un-animated content (FOUC).
 *
 * Usage (in a "use client" component):
 *   const ref = useRef<HTMLDivElement>(null);
 *   useStaggerEntrance(ref);
 *   return <div ref={ref}><div data-animate>...</div></div>;
 */
import { RefObject, useLayoutEffect } from "react";
import gsap from "gsap";

export default gsap;

// --- Shared tween defaults
const EASE = "power2.out";

/**
 * Stagger-fade-up for elements matching `selector` inside the container.
 * Pass `deps` to re-trigger the animation when values change (e.g. after
 * an async check completes and the container becomes visible).
 */
export function useStaggerEntrance(
  container: RefObject<HTMLElement | null>,
  options: {
    from?: gsap.TweenVars;
    stagger?: number;
    delay?: number;
    duration?: number;
    selector?: string;
    /** Extra deps that, when changed, re-trigger the animation. */
    deps?: unknown[];
  } = {}
) {
  const {
    from = { opacity: 0, y: 22 },
    stagger = 0.07,
    delay = 0,
    duration = 0.55,
    selector = "[data-animate]",
    deps = [],
  } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const targets = container.current.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;
    const ctx = gsap.context(() => {
      gsap.from(targets, { ...from, duration, stagger, delay, ease: EASE, clearProps: "all" });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Scale + fade for a single element (cards, modals, login form).
 * Pass `deps` to re-trigger once the element is actually mounted
 * (e.g. after an async loading check resolves).
 */
export function useScaleEntrance(
  container: RefObject<HTMLElement | null>,
  options: {
    delay?: number;
    duration?: number;
    /** Extra deps that, when changed, re-trigger the animation. */
    deps?: unknown[];
  } = {}
) {
  const { delay = 0, duration = 0.45, deps = [] } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const ctx = gsap.context(() => {
      gsap.from(container.current!, {
        opacity: 0,
        scale: 0.97,
        y: 12,
        duration,
        delay,
        ease: EASE,
        clearProps: "all",
      });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Simple fade-in for navigation / footer elements.
 */
export function useFadeIn(
  container: RefObject<HTMLElement | null>,
  options: { delay?: number; duration?: number; y?: number } = {}
) {
  const { delay = 0, duration = 0.4, y = -6 } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const ctx = gsap.context(() => {
      gsap.from(container.current!, { opacity: 0, y, duration, delay, ease: EASE, clearProps: "all" });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
