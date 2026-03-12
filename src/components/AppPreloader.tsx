"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function AppPreloader() {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hide = () => {
      timerRef.current = setTimeout(() => setVisible(false), 500);
    };

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
    }

    // Hard fallback — always hide after 3 s even if load never fires
    const fallback = setTimeout(() => setVisible(false), 3000);

    return () => {
      window.removeEventListener("load", hide);
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background"
          aria-hidden="true"
        >
          {/* Ambient orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent/8 blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-500/8 blur-[100px]" />
            <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/4 blur-[80px]" />
          </div>

          {/* Pulsing logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 28 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-6"
          >
            {/* Ripple ring */}
            <motion.div
              animate={{
                scale: [1, 1.6, 1.6],
                opacity: [0.5, 0, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-3xl bg-accent"
            />
            <motion.div
              animate={{ scale: [1, 1, 1.05, 1] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-accent shadow-2xl shadow-accent/40"
            >
              <Heart
                className="h-10 w-10 text-accent-foreground"
                strokeWidth={2}
              />
            </motion.div>
          </motion.div>

          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="text-center"
          >
            <p className="text-xl font-black tracking-tight text-foreground">
              GCK Confessions
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your anonymous space
            </p>
          </motion.div>

          {/* Bouncing dots */}
          <div className="mt-8 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
                className="block h-2 w-2 rounded-full bg-accent"
              />
            ))}
          </div>

          {/* Bottom progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-border/30">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-linear-to-r from-accent/60 via-accent to-accent/60"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
