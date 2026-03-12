"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useMotionRuntime } from "@/components/MotionProvider";

const MIN_VISIBLE_MS = 650;
const FALLBACK_HIDE_MS = 2600;

export default function AppPreloader() {
  const [visible, setVisible] = useState(true);
  const mountedAtRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedExitRef = useRef(false);
  const { setAppReady } = useMotionRuntime();

  useEffect(() => {
    mountedAtRef.current = Date.now();
    document.documentElement.setAttribute("data-app-loading", "true");
    document.body.style.overflow = "hidden";

    const beginHide = () => {
      if (hasStartedExitRef.current) return;
      hasStartedExitRef.current = true;
      setVisible(false);
    };

    const scheduleHide = () => {
      const elapsed = Date.now() - mountedAtRef.current;
      const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

      hideTimerRef.current = setTimeout(beginHide, delay);
    };

    const maybeReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (maybeReduceMotion) {
      setVisible(false);
      return () => {
        document.documentElement.removeAttribute("data-app-loading");
        document.body.style.overflow = "";
      };
    };

    if (document.readyState === "complete") {
      scheduleHide();
    } else {
      window.addEventListener("load", scheduleHide, { once: true });
    }

    // Hard fallback for flaky network or stalled resources
    fallbackTimerRef.current = setTimeout(beginHide, FALLBACK_HIDE_MS);

    return () => {
      window.removeEventListener("load", scheduleHide);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      document.documentElement.removeAttribute("data-app-loading");
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.documentElement.removeAttribute("data-app-loading");
        document.body.style.overflow = "";
        setAppReady(true);
      }}
    >
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background"
          aria-hidden="true"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--foreground)/0.06),transparent_40%),radial-gradient(circle_at_85%_78%,hsl(var(--accent)/0.16),transparent_36%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.16)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.16)_1px,transparent_1px)] bg-size-[24px_24px] opacity-20" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex w-[min(92vw,23rem)] flex-col items-center p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 2, -2, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12"
              >
                <motion.span
                  className="absolute inset-0 rounded-xl border border-accent/45"
                  animate={{ scale: [1, 1.16], opacity: [0.35, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
                <Heart className="h-5 w-5 text-accent" strokeWidth={2.3} />
              </motion.div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-foreground">GCK Confessions</p>
                <p className="text-xs text-muted-foreground">Warming up moderation tools</p>
              </div>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
              <motion.div
                initial={{ x: "-65%" }}
                animate={{ x: ["-65%", "100%"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="h-full w-2/3 rounded-full bg-accent"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
