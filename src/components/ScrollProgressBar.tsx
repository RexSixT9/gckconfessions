"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useMotionRuntime } from "@/components/MotionProvider";

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    mass: 0.2,
  });
  const { isAppReady } = useMotionRuntime();

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isAppReady ? 1 : 0, y: isAppReady ? 0 : -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed inset-x-3 z-40 sm:inset-x-4"
      style={{
        top: "calc(var(--header-offset, var(--header-height, 0px)) + 0.25rem)",
      }}
      aria-hidden
    >
      <div className="overflow-hidden rounded-full border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm supports-backdrop-filter:bg-background/65">
        <div className="h-1.5 sm:h-1">
          <motion.div
            className="h-full origin-left bg-linear-to-r from-accent/60 via-accent to-accent/70"
            style={{ scaleX }}
          />
        </div>
      </div>
    </motion.div>
  );
}