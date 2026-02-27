"use client";
import { RefObject, useLayoutEffect } from "react";
import gsap, { ScrollTrigger } from "./gsap";

// ── Shared defaults ──────────────────────────────────────────────────────────
const EASE = "power2.out";

/** True when the user has requested reduced motion. Client-only. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Lazy-init ScrollTrigger config — called from the first hook that uses it,
// guaranteed to be client-side (inside useLayoutEffect).
let stConfigured = false;
function ensureScrollTriggerConfig() {
  if (stConfigured) return;
  stConfigured = true;
  ScrollTrigger.config({ ignoreMobileResize: true });
}

// ── useStaggerEntrance ────────────────────────────────────────────────────────
/**
 * Stagger-fade-up for elements matching `selector` inside the container.
 * Fires immediately on mount. Pass `deps` to re-trigger.
 */
export function useStaggerEntrance(
  container: RefObject<HTMLElement | null>,
  options: {
    from?: gsap.TweenVars;
    stagger?: number;
    delay?: number;
    duration?: number;
    selector?: string;
    deps?: unknown[];
  } = {}
) {
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const selector = options.selector || "[data-animate]";
    const targets = el.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      targets.forEach((t) => { t.style.opacity = "1"; t.style.transform = "none"; });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: 20 });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        ease: options.from?.ease || EASE,
        stagger: options.stagger ?? 0.08,
        delay: options.delay ?? 0,
        duration: options.duration ?? 0.5,
        clearProps: "all",
        ...options.from,
      });
    }, container);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.deps || []);
}

// ── useScaleEntrance ──────────────────────────────────────────────────────────
/** Scale + fade entrance for a single element (cards, modals). */
export function useScaleEntrance(
  container: RefObject<HTMLElement | null>,
  options: { delay?: number; duration?: number; deps?: unknown[] } = {}
) {
  const { delay = 0, duration = 0.45, deps = [] } = options;

  useLayoutEffect(() => {
    if (!container.current) return;

    if (prefersReducedMotion()) {
      container.current.style.opacity = "1";
      container.current.style.transform = "none";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(container.current!, { opacity: 0, scale: 0.97, y: 10, duration, delay, ease: EASE, clearProps: "all" });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ── useFadeIn ─────────────────────────────────────────────────────────────────
/** Simple fade-in for nav / footer. */
export function useFadeIn(
  container: RefObject<HTMLElement | null>,
  options: { delay?: number; duration?: number; y?: number } = {}
) {
  const { delay = 0, duration = 0.4, y = -6 } = options;

  useLayoutEffect(() => {
    if (!container.current) return;

    if (prefersReducedMotion()) {
      container.current.style.opacity = "1";
      container.current.style.transform = "none";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(container.current!, { opacity: 0, y, duration, delay, ease: EASE, clearProps: "all" });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── useCountUp ────────────────────────────────────────────────────────────────
/** Count-up for [data-count] elements. Snaps immediately with reduced-motion. */
export function useCountUp(
  container: RefObject<HTMLElement | null>,
  options: { duration?: number; delay?: number; deps?: unknown[] } = {}
) {
  const { duration = 1.2, delay = 0.15, deps = [] } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const targets = container.current.querySelectorAll<HTMLElement>("[data-count]");
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      targets.forEach((el) => {
        el.textContent = parseInt(el.getAttribute("data-count") || "0", 10).toLocaleString();
      });
      return;
    }

    const ctx = gsap.context(() => {
      targets.forEach((el, i) => {
        const end = parseInt(el.getAttribute("data-count") || "0", 10);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end, duration, delay: delay + i * 0.1, ease: "power2.out",
          onUpdate() { el.textContent = Math.round(obj.val).toLocaleString(); },
        });
      });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ── useBlurReveal ─────────────────────────────────────────────────────────────
/** Blur-to-clear + slide-up entrance for [data-reveal] children. */
export function useBlurReveal(
  container: RefObject<HTMLElement | null>,
  options: { stagger?: number; delay?: number; duration?: number; selector?: string; deps?: unknown[] } = {}
) {
  const { stagger = 0.08, delay = 0, duration = 0.55, selector = "[data-reveal]", deps = [] } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const targets = container.current.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      targets.forEach((t) => { t.style.opacity = "1"; t.style.filter = "none"; t.style.transform = "none"; });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(targets, { opacity: 0, y: 14, filter: "blur(5px)", duration, stagger, delay, ease: "power3.out", clearProps: "all" });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ── useScrollReveal ───────────────────────────────────────────────────────────
/**
 * Scroll-triggered reveal for [data-scroll] sections.
 *
 * Strategy:
 * 1. `gsap.set()` hides elements immediately (no flash — runs in useLayoutEffect).
 * 2. `ScrollTrigger.create({ onEnter })` tweens them visible when scrolled into view.
 * 3. After all triggers are created, `ScrollTrigger.refresh()` recalculates positions.
 *    Any element whose trigger start is already past the scroll position fires `onEnter`
 *    immediately — preventing permanently-hidden content.
 *
 * This pattern is more reliable than `gsap.from({ immediateRender: false })` because:
 * - Elements are hidden from the very first paint (no visible → visible wobble).
 * - Already-in-viewport elements are handled by the refresh() safety net.
 */
export function useScrollReveal(
  container: RefObject<HTMLElement | null>,
  options: {
    from?: gsap.TweenVars;
    stagger?: number;
    duration?: number;
    selector?: string;
    start?: string;
    deps?: unknown[];
  } = {}
) {
  const {
    from = { opacity: 0, y: 28 },
    stagger = 0.1,
    duration = 0.55,
    selector = "[data-scroll]",
    start = "top 92%",
    deps = [],
  } = options;

  useLayoutEffect(() => {
    if (!container.current) return;

    ensureScrollTriggerConfig();

    const targets = container.current.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      targets.forEach((t) => { t.style.opacity = "1"; t.style.transform = "none"; });
      return;
    }

    const ctx = gsap.context(() => {
      targets.forEach((target) => {
        const children = target.querySelectorAll<HTMLElement>("[data-scroll-child]");
        const animTargets = children.length > 0 ? Array.from(children) : [target];
        const itemStagger = children.length > 0 ? stagger : 0;

        // Hide immediately — runs before first paint since we're in useLayoutEffect.
        gsap.set(animTargets, { ...from });

        ScrollTrigger.create({
          trigger: target,
          start,
          once: true,
          // When the element enters the viewport, animate to visible.
          onEnter: () => {
            gsap.to(animTargets, {
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
              filter: "blur(0px)",
              duration,
              stagger: itemStagger,
              ease: EASE,
              clearProps: "all",
            });
          },
        });
      });

      // Force recalculation of all trigger positions.
      // Any trigger whose element is already past `start` will fire onEnter
      // immediately — this prevents permanently-hidden elements on pages
      // where the content is already in the viewport on load.
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }, container);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}