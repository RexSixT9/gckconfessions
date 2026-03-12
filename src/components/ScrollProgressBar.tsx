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
      <div className="h-1 bg-accent/10 backdrop-blur-sm">
        <motion.div
          className="h-full origin-left bg-linear-to-r from-pink-400 via-accent to-rose-500 shadow-[0_0_20px_hsl(var(--accent)/0.55)]"
          style={{ scaleX }}
        />
      </div>
    </motion.div>
  );
}