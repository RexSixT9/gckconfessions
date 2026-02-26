"use client";
import { RefObject, useLayoutEffect } from "react";
import gsap from "./gsap";

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
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const selector = options.selector || "[data-animate]";
    const targets = el.querySelectorAll(selector);
    if (!targets.length) return;
    gsap.set(targets, { opacity: 0, y: 24 });
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      ease: options.from?.ease || EASE,
      stagger: options.stagger ?? 0.08,
      delay: options.delay ?? 0,
      duration: options.duration ?? 0.55,
      ...options.from,
    });
    return () => {
      gsap.set(targets, { opacity: 0, y: 24 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.deps || []);
}