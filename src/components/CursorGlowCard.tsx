"use client";

import { motion, MotionProps } from "framer-motion";
import { useCursorGlow } from "@/hooks/useCursorGlow";
import { ReactNode } from "react";

interface CursorGlowCardProps extends Omit<MotionProps, "ref"> {
  children: ReactNode;
  className?: string;
  glowType?: "border" | "background" | "both";
}

/**
 * Card component with cursor-following glow effect
 * Uses CSS custom properties and mouse tracking for modern interaction
 */
export default function CursorGlowCard({
  children,
  className = "",
  glowType = "both",
  ...motionProps
}: CursorGlowCardProps) {
  const cardRef = useCursorGlow();

  const glowClasses = {
    border: "cursor-border-glow",
    background: "cursor-glow",
    both: "cursor-glow cursor-border-glow",
  };

  return (
    <motion.div
      ref={cardRef}
      className={`${glowClasses[glowType]} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
