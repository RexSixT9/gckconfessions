"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LazyMotion, domAnimation } from "framer-motion";

type MotionRuntimeValue = {
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;
  shouldReduceMotion: boolean;
};

const MotionRuntimeContext = createContext<MotionRuntimeValue | null>(null);

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
  const [isAppReady, setAppReady] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setShouldReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const value = useMemo(
    () => ({ isAppReady, setAppReady, shouldReduceMotion }),
    [isAppReady, shouldReduceMotion]
  );

  return (
    <LazyMotion features={domAnimation}>
      <MotionRuntimeContext.Provider value={value}>
        {children}
      </MotionRuntimeContext.Provider>
    </LazyMotion>
  );
}

export function useMotionRuntime() {
  const value = useContext(MotionRuntimeContext);

  if (!value) {
    throw new Error("useMotionRuntime must be used within MotionProvider.");
  }

  return value;
}
