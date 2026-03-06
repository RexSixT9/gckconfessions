"use client";

import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface CursorGlowCardProps extends Omit<MotionProps, "ref"> {
  children: ReactNode;
  className?: string;
  /** Override GlowingEffect spread (px). Default 360. */
  glowSpread?: number;
  /** Override proximity distance (px). Default 80. */
  glowProximity?: number;
}

/**
 * Motion card with the Cursor-style proximity border glow.
 *
 * The card must have `position: relative` for the absolutely-positioned glow
 * layers to size correctly — all the card* CSS helpers already do this.
 */
export default function CursorGlowCard({
  children,
  className = "",
  glowSpread = 360,
  glowProximity = 80,
  ...motionProps
}: CursorGlowCardProps) {
  return (
    <motion.div className={`relative ${className}`} {...motionProps}>
      {/* Proximity glow — pointer device only */}
      <GlowingEffect
        spread={glowSpread}
        glow={false}
        proximity={glowProximity}
        inactiveZone={0.03}
        maxOpacity={0.85}
      />
      {children}
    </motion.div>
  );
}
