"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionRuntime } from "@/components/MotionProvider";
import { isLowEndDevice } from "@/lib/motionConfig";

type InViewOptions = NonNullable<Parameters<typeof useInView>[1]>;
type InViewMargin = Exclude<InViewOptions["margin"], undefined>;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
};

export function PageReveal({
  children,
  className,
  delay = 0,
  y = 16,
  duration = 0.45,
}: RevealProps) {
  const { isAppReady, shouldReduceMotion } = useMotionRuntime();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const effectiveY = shouldReduceMotion ? 0 : isMobile ? Math.min(y, 10) : y;
  const effectiveDuration = shouldReduceMotion ? 0.01 : isMobile ? Math.min(duration, 0.35) : duration;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: effectiveY }}
      animate={isAppReady ? { opacity: 1, y: 0 } : { opacity: 0, y: effectiveY }}
      transition={{ duration: effectiveDuration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 20,
  duration = 0.45,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { isAppReady, shouldReduceMotion } = useMotionRuntime();
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEnd] = useState(() => (typeof window !== "undefined" ? isLowEndDevice() : false));

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const inViewOptions = useMemo(() => {
    const margin: InViewMargin = isMobile || isLowEnd ? "0px 0px -24px 0px" : "0px 0px -56px 0px";
    return {
      once: true,
      margin,
      amount: isMobile || isLowEnd ? 0.03 : 0.08,
    };
  }, [isLowEnd, isMobile]);

  const inView = useInView(ref, {
    once: inViewOptions.once,
    margin: inViewOptions.margin,
    amount: inViewOptions.amount,
  });

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const visible = isAppReady && inView;
  const effectiveY = isMobile || isLowEnd ? Math.min(y, 12) : y;
  const effectiveDuration = isMobile || isLowEnd ? Math.min(duration, 0.35) : duration;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: effectiveY }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: effectiveY }}
      transition={{ duration: effectiveDuration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}