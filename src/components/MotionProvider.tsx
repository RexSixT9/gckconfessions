"use client";

import { ReactNode } from "react";
import { LazyMotion, domAnimation } from "framer-motion";

/**
 * MotionProvider wraps the app with Framer Motion's LazyMotion
 * using domAnimation preset (~18kb instead of ~100kb full runtime)
 * 
 * This is a client-side boundary that enables:
 * - motion.* components
 * - AnimatePresence
 * - Significantly reduced JS bundle size
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
