"use client";
/**
 * GSAP animation utilities for Next.js App Router.
 *
 * Core GSAP logic and Re-exports.
 * Hook-based utilities are in gsapClient.ts.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default gsap;
export { ScrollTrigger };
