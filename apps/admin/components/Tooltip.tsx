"use client";

import { ReactNode, useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

const sideAnimations = {
  top: {
    initial: { opacity: 0, scale: 0.9, y: 4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 4 },
  },
  bottom: {
    initial: { opacity: 0, scale: 0.9, y: -4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: -4 },
  },
  left: {
    initial: { opacity: 0, scale: 0.9, x: 4 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.9, x: 4 },
  },
  right: {
    initial: { opacity: 0, scale: 0.9, x: -4 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.9, x: -4 },
  },
};

export default function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const anim = sideAnimations[side];

  const calculatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) return;

    const trigger = containerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const pad = 8; // viewport padding

    let top = 0;
    let left = 0;

    // Calculate initial position based on side
    switch (side) {
      case "top":
        top = -tooltip.height - 8;
        left = (trigger.width - tooltip.width) / 2;
        break;
      case "bottom":
        top = trigger.height + 8;
        left = (trigger.width - tooltip.width) / 2;
        break;
      case "left":
        top = (trigger.height - tooltip.height) / 2;
        left = -tooltip.width - 8;
        break;
      case "right":
        top = (trigger.height - tooltip.height) / 2;
        left = trigger.width + 8;
        break;
    }

    // Clamp horizontal: prevent overflow left/right of viewport
    const absoluteLeft = trigger.left + left;
    const absoluteRight = absoluteLeft + tooltip.width;

    if (absoluteLeft < pad) {
      left += pad - absoluteLeft;
    } else if (absoluteRight > window.innerWidth - pad) {
      left -= absoluteRight - (window.innerWidth - pad);
    }

    // Clamp vertical: prevent overflow top/bottom of viewport
    const absoluteTop = trigger.top + top;
    if (absoluteTop < pad && (side === "top" || side === "left" || side === "right")) {
      // Flip to bottom
      top = trigger.height + 8;
    }

    setPosition({ top, left });
  }, [side]);

  useEffect(() => {
    if (open) {
      // Small delay to let the tooltip render and get its dimensions
      requestAnimationFrame(calculatePosition);
    }
  }, [open, calculatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={tooltipRef}
            role="tooltip"
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            transition={{ duration: 0.13, ease: "easeOut" }}
            className="pointer-events-none absolute z-50"
            style={position}
          >
            <span className="block max-w-[min(calc(100vw-2rem),260px)] whitespace-normal rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium leading-snug text-background shadow-lg">
              {content}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

