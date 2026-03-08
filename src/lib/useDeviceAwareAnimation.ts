"use client";

/**
 * useDeviceAwareAnimation
 * 
 * Returns animation variants that adapt to device capability:
 * - Desktop: Full complexity (blur, scale, directional)
 * - Mobile/Low-end: Simplified (fade + subtle y only)
 * - Reduced motion: Instant snap
 */

import { 
  getAnimQuality, 
  getDuration, 
  isMobileViewport, 
  prefersReducedMotion,
  eases 
} from "@/lib/motionConfig";

export function useBentoCardVariants(index: number = 0) {
  const quality = getAnimQuality();
  const duration = getDuration(0.65);
  const isMobile = isMobileViewport();

  if (quality === "reduced") {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.001 },
      },
    };
  }

  if (quality === "mobile") {
    // Mobile: simple fade + subtle lift, no directional shift
    return {
      hidden: { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration, ease: eases.standard },
      },
    };
  }

  // Desktop: full cinematic entrance with directional shift
  const x = index % 2 === 0 ? -18 : 18;
  return {
    hidden: { opacity: 0, x, y: 28, scale: 0.96 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration, ease: eases.smooth },
    },
  };
}

export function useHowItWorksCardVariants(index: number = 0) {
  const quality = getAnimQuality();
  const duration = getDuration(0.65);

  if (quality === "reduced") {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.001 } },
    };
  }

  if (quality === "mobile") {
    return {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration, ease: eases.standard } },
    };
  }

  return {
    hidden: { opacity: 0, y: 36, scale: 0.92 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration, ease: eases.smooth },
    },
  };
}

export function useIconVariants(index: number = 0) {
  const quality = getAnimQuality();

  if (quality === "reduced") {
    return {
      initial: { opacity: 0 },
      whileInView: { opacity: 1 },
      whileHover: {},
      viewport: { once: true },
      transition: { duration: 0.001 },
    };
  }

  if (quality === "mobile") {
    // Mobile: no hover effects, simple fade-scale entrance
    return {
      initial: { opacity: 0, scale: 0.85 },
      whileInView: { opacity: 1, scale: 1 },
      whileHover: {}, // No hover on touch
      viewport: { once: true },
      transition: { type: "spring", stiffness: 300, damping: 20, delay: index * 0.08 },
    };
  }

  // Desktop: spring-based bounce entrance on viewport, rotational hover
  const rotation = index % 2 === 0 ? -15 : 15;
  return {
    initial: { opacity: 0, scale: 0.55, rotate: rotation },
    whileInView: { opacity: 1, scale: 1, rotate: 0 },
    whileHover: { scale: 1.1, rotate: Math.abs(rotation) * 0.5 },
    viewport: { once: true },
    transition: { 
      type: "spring", 
      stiffness: 380, 
      damping: 16, 
      delay: index * 0.1,
    },
  };
}

export function useBadgePopVariants(index: number = 0) {
  const quality = getAnimQuality();

  if (quality === "reduced") {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.001 } },
    };
  }

  if (quality === "mobile") {
    return {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: getDuration(0.3), ease: eases.standard },
      },
    };
  }

  return {
    hidden: { opacity: 0, scale: 0.78, y: 8 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: getDuration(0.38),
        ease: eases.snappy,
      },
    },
  };
}

export function useStaggerContainerVariants(staggerDelay: number = 0.1) {
  const quality = getAnimQuality();

  if (quality === "reduced") {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0, delayChildren: 0 },
      },
    };
  }

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay, delayChildren: 0.05 },
    },
  };
}

/**
 * useHoverLift — apply subtle lift on hover (disabled on mobile)
 */
export function useHoverLift() {
  const quality = getAnimQuality();

  if (quality === "mobile" || quality === "reduced") {
    return { y: 0 };
  }

  return { y: -6, transition: { duration: getDuration(0.28), ease: eases.standard } };
}
