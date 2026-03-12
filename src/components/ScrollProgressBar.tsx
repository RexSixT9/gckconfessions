"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 34,
    mass: 0.16,
  });

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 z-60"
      style={{
        top: "env(safe-area-inset-top, 0px)",
      }}
      aria-hidden
    >
      <div className="h-0.5 bg-border/40 sm:h-px">
        <motion.div
          className="h-full origin-left bg-linear-to-r from-accent/55 via-accent to-accent/85"
          style={{ scaleX }}
        />
      </div>
    </motion.div>
  );
}