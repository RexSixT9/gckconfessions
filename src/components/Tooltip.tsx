"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

const sideStyles = {
  top: {
    container: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    initial: { opacity: 0, scale: 0.9, y: 4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 4 },
  },
  bottom: {
    container: "top-full left-1/2 mt-2 -translate-x-1/2",
    initial: { opacity: 0, scale: 0.9, y: -4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: -4 },
  },
  left: {
    container: "right-full top-1/2 mr-2 -translate-y-1/2",
    initial: { opacity: 0, scale: 0.9, x: 4 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.9, x: 4 },
  },
  right: {
    container: "left-full top-1/2 ml-2 -translate-y-1/2",
    initial: { opacity: 0, scale: 0.9, x: -4 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.9, x: -4 },
  },
};

export default function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const s = sideStyles[side];

  return (
    <div
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
            role="tooltip"
            initial={s.initial}
            animate={s.animate}
            exit={s.exit}
            transition={{ duration: 0.13, ease: "easeOut" }}
            className={`pointer-events-none absolute z-50 ${s.container}`}
          >
            <span className="block whitespace-nowrap rounded-md bg-[hsl(var(--foreground))] px-2.5 py-1.5 text-xs font-medium leading-none text-[hsl(var(--background))] shadow-lg">
              {content}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
