"use client";

import { useEffect, useMemo } from "react";
import { useMotionRuntime } from "@/components/MotionProvider";
import { isLowEndDevice, prefersReducedMotion } from "@/lib/motionConfig";

export default function ClientVisualEffects() {
  const { setAppReady } = useMotionRuntime();

  const allowHeavyVisuals = useMemo(() => {
    if (typeof window === "undefined") return false;
    return false && !prefersReducedMotion() && !isLowEndDevice();
  }, []);

  useEffect(() => {
    if (!allowHeavyVisuals) {
      setAppReady(true);
    }
  }, [allowHeavyVisuals, setAppReady]);

  return (
    <>
      {allowHeavyVisuals ? null : null}
    </>
  );
}
