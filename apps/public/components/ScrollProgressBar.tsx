"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 190,
    damping: prefersReducedMotion ? 100 : 30,
    mass: prefersReducedMotion ? 0.3 : 0.18,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 z-60"
      style={{
        top: "env(safe-area-inset-top, 0px)",
      }}
      aria-hidden
    >
      <div className="h-0.5 bg-border/40">
        <motion.div
          className="h-full origin-left transform-gpu bg-foreground/85 will-change-transform"
          style={{ scaleX }}
        />
      </div>
    </motion.div>
  );
}