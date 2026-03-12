"use client";

import { ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionRuntime } from "@/components/MotionProvider";

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

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={isAppReady ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
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
  const inView = useInView(ref, {
    once: true,
    margin: "0px 0px -80px 0px",
    amount: 0.2,
  });

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const visible = isAppReady && inView;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}