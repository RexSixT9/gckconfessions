"use client";

/**
 * Motion Config & Device Detection
 * 
 * Centralized animation configuration respecting:
 * - Device capability (reduce on mobile/low-end)
 * - OS reduced-motion preference
 * - Touch vs pointer input
 */

let _prefersReducedMotion: boolean | null = null;
let _isTouchDevice: boolean | null = null;
let _isMobile: boolean | null = null;
let _isLowEndDevice: boolean | null = null;

/**
 * Check if user has `prefers-reduced-motion: reduce` set
 */
export function prefersReducedMotion(): boolean {
  if (_prefersReducedMotion !== null) return _prefersReducedMotion;
  if (typeof window === "undefined") return false;
  _prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return _prefersReducedMotion;
}

/**
 * Check if device is touch-only (mobile/tablet without mouse)
 */
export function isTouchDevice(): boolean {
  if (_isTouchDevice !== null) return _isTouchDevice;
  if (typeof window === "undefined") return false;
  _isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  return _isTouchDevice;
}

/**
 * Check if viewport is mobile (<640px)
 */
export function isMobileViewport(): boolean {
  if (_isMobile !== null) return _isMobile;
  if (typeof window === "undefined") return false;
  _isMobile = window.innerWidth < 640;
  return _isMobile;
}

/**
 * Check if device is likely low-end (high latency, low FPS)
 * Uses effective type and/or user agent heuristics
 */
export function isLowEndDevice(): boolean {
  if (_isLowEndDevice !== null) return _isLowEndDevice;
  if (typeof window === "undefined") return false;

  // Check Connection API if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    const effectiveType = connection.effectiveType || "4g";
    // Treat 2g, 3g, or 4g-on-slow-network as low-end
    if (effectiveType === "2g" || effectiveType === "3g" || connection.saveData) {
      _isLowEndDevice = true;
      return true;
    }
  }

  // Fallback: check device memory if available
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    _isLowEndDevice = true;
    return true;
  }

  _isLowEndDevice = false;
  return false;
}

/**
 * Animation duration presets
 */
export const animDurations = {
  fast: 0.25,
  normal: 0.45,
  slow: 0.65,
  verySlow: 0.85,
};

/**
 * Get duration based on device capability
 */
export function getDuration(base: number = animDurations.normal): number {
  if (prefersReducedMotion()) return 0.01; // Snap instantly
  if (isLowEndDevice()) return base * 1.3; // Slightly longer for perception
  return base;
}

/**
 * Animation degrees of quality
 * DESKTOP: full effects (blur, scale, complex easing)
 * MOBILE: reduced (no blur, simpler transforms)
 * REDUCED: instant snaps
 */
export type AnimQuality = "reduced" | "mobile" | "desktop";

export function getAnimQuality(): AnimQuality {
  if (prefersReducedMotion()) return "reduced";
  if (isMobileViewport() || isLowEndDevice()) return "mobile";
  return "desktop";
}

/**
 * Get common easing curves
 */
export const eases = {
  smooth: [0.22, 1, 0.36, 1], // Smooth spring-like ease
  snappy: [0.34, 1.56, 0.64, 1], // Overshoot, punchy
  standard: [0.4, 0, 0.2, 1], // Material Design-style
};

/**
 * Get viewport info for responsive animations
 */
export function getViewportInfo() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0, isMobile: false, isTablet: false, isDesktop: false };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  return { width, height, isMobile, isTablet, isDesktop };
}

/**
 * Reset cached values (useful for testing or dynamic changes)
 */
export function resetCache() {
  _prefersReducedMotion = null;
  _isTouchDevice = null;
  _isMobile = null;
  _isLowEndDevice = null;
}
