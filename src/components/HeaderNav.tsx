"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";

export default function HeaderNav() {
  const headerRef = useRef<HTMLElement>(null);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      if (currentY <= 8) {
        setIsHidden(false);
        lastY = currentY;
        return;
      }

      if (Math.abs(delta) < 4) return;

      if (delta > 0 && currentY > 72) {
        setIsHidden(true);
      } else if (delta < 0) {
        setIsHidden(false);
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep --header-height CSS variable accurate at all times
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const height = `${el.offsetHeight}px`;
      document.documentElement.style.setProperty("--header-height", height);
      document.documentElement.style.setProperty("--header-offset", isHidden ? "0px" : height);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isHidden]);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 animate-fade-in transition-transform duration-300",
          isHidden && "-translate-y-full"
        )}
      >
        <div className="relative px-3 pb-1.5 pt-2 sm:px-4">
          <div className="relative mx-auto flex max-w-5xl items-center justify-between overflow-hidden rounded-2xl border border-border/60 bg-background/90 px-3.5 py-2.5 shadow-sm backdrop-blur-xl sm:px-5">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="GCK Confessions Home"
            >
              <motion.span
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.12 }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent shadow-sm transition-shadow duration-200 group-hover:shadow-accent/30 group-hover:shadow-md"
              >
                <Heart className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={2.5} />
              </motion.span>
              <span className="text-sm font-semibold tracking-tight">GCK Confessions</span>
            </Link>

            {/* Theme toggle only */}
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
