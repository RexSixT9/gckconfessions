"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useMotionRuntime } from "@/components/MotionProvider";
import { isLowEndDevice, prefersReducedMotion } from "@/lib/motionConfig";

const CursorEffects = dynamic(
  () => import("@/components/CursorEffects").then((m) => m.CursorEffects),
  { ssr: false }
);
const ScrollProgressBar = dynamic(() => import("@/components/ScrollProgressBar"), { ssr: false });
const AppPreloader = dynamic(() => import("@/components/AppPreloader"), { ssr: false });

export default function ClientVisualEffects() {
  const { setAppReady } = useMotionRuntime();

  const allowHeavyVisuals = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !prefersReducedMotion() && !isLowEndDevice();
  }, []);

  useEffect(() => {
    if (!allowHeavyVisuals) {
      setAppReady(true);
    }
  }, [allowHeavyVisuals, setAppReady]);

  return (
    <>
      {allowHeavyVisuals ? <AppPreloader /> : null}
      {allowHeavyVisuals ? <ScrollProgressBar /> : null}
      {allowHeavyVisuals ? <CursorEffects /> : null}
    </>
  );
}
