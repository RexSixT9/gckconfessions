"use client";
import { RefObject, useLayoutEffect } from "react";
import gsap, { ScrollTrigger } from "./gsap";

// --- Shared tween defaults
const EASE = "power2.out";

/** Returns true when the user prefers reduced motion. Safe to call in useLayoutEffect (client-only). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Stagger-fade-up for elements matching `selector` inside the container.
 * Pass `deps` to re-trigger the animation when values change.
 * Respects prefers-reduced-motion.
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

    // Reduced-motion: just make elements visible instantly
    if (prefersReducedMotion()) {
      const selector = options.selector || "[data-animate]";
      el.querySelectorAll(selector).forEach((t) => {
        (t as HTMLElement).style.opacity = "1";
        (t as HTMLElement).style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
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
        clearProps: "all",
        ...options.from,
      });
    }, container);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.deps || []);
}

/**
 * Scale + fade entrance for a single element.
 * Respects prefers-reduced-motion.
 */
export function useScaleEntrance(
  container: RefObject<HTMLElement | null>,
  options: {
    delay?: number;
    duration?: number;
    deps?: unknown[];
  } = {}
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
 * Respects prefers-reduced-motion.
 */
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

/**
 * Animate a number counting up from 0 to its target value.
 * Respects prefers-reduced-motion by snapping directly to the final value.
 */
export function useCountUp(
  container: RefObject<HTMLElement | null>,
  options: {
    duration?: number;
    delay?: number;
    deps?: unknown[];
  } = {}
) {
  const { duration = 1.2, delay = 0.15, deps = [] } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const targets = container.current.querySelectorAll<HTMLElement>("[data-count]");
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      targets.forEach((el) => {
        const end = parseInt(el.getAttribute("data-count") || "0", 10);
        el.textContent = end.toLocaleString();
      });
      return;
    }

    const ctx = gsap.context(() => {
      targets.forEach((el, i) => {
        const end = parseInt(el.getAttribute("data-count") || "0", 10);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end,
          duration,
          delay: delay + i * 0.1,
          ease: "power2.out",
          onUpdate() {
            el.textContent = Math.round(obj.val).toLocaleString();
          },
        });
      });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Reveal children with a blur-to-clear + slide-up entrance.
 * Respects prefers-reduced-motion.
 */
export function useBlurReveal(
  container: RefObject<HTMLElement | null>,
  options: {
    stagger?: number;
    delay?: number;
    duration?: number;
    selector?: string;
    deps?: unknown[];
  } = {}
) {
  const {
    stagger = 0.08,
    delay = 0,
    duration = 0.6,
    selector = "[data-reveal]",
    deps = [],
  } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const targets = container.current.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      targets.forEach((t) => {
        t.style.opacity = "1";
        t.style.filter = "none";
        t.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y: 16,
        filter: "blur(6px)",
        duration,
        stagger,
        delay,
        ease: "power3.out",
        clearProps: "all",
      });
    }, container);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Scroll-triggered reveal: elements animate in when they enter the viewport.
 * Hidden state is applied only after mount to avoid flash of invisible content.
 * Respects prefers-reduced-motion.
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
    start = "top 90%",
    deps = [],
  } = options;

  useLayoutEffect(() => {
    if (!container.current) return;
    const targets = container.current.querySelectorAll<HTMLElement>(selector);
    if (!targets.length) return;

    // Reduced-motion: just make everything visible immediately
    if (prefersReducedMotion()) {
      targets.forEach((t) => {
        t.style.opacity = "1";
        t.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      targets.forEach((target) => {
        const children = target.querySelectorAll<HTMLElement>("[data-scroll-child]");
        const animTargets = children.length > 0 ? children : [target];

        // Set hidden state right away so there's no layout-shift flash
        gsap.set(animTargets, { ...from });

        ScrollTrigger.create({
          trigger: target,
          start,
          once: true,
          onEnter: () => {
            gsap.to(animTargets, {
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
              filter: "blur(0px)",
              duration,
              stagger: children.length > 0 ? stagger : 0,
              ease: EASE,
              clearProps: "all",
            });
          },
        });
      });
    }, container);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}