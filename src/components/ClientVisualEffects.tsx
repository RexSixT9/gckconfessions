"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { isLowEndDevice, prefersReducedMotion } from "@/lib/motionConfig";

const CursorEffects = dynamic(
  () => import("@/components/CursorEffects").then((m) => m.CursorEffects),
  { ssr: false }
);
const ScrollProgressBar = dynamic(() => import("@/components/ScrollProgressBar"), { ssr: false });
const AppPreloader = dynamic(() => import("@/components/AppPreloader"), { ssr: false });

export default function ClientVisualEffects() {
  const allowHeavyVisuals = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !prefersReducedMotion() && !isLowEndDevice();
  }, []);

  return (
    <>
      {allowHeavyVisuals ? <AppPreloader /> : null}
      {allowHeavyVisuals ? <ScrollProgressBar /> : null}
      {allowHeavyVisuals ? <CursorEffects /> : null}
    </>
  );
}
