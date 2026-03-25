"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cpu } from "lucide-react";
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
          "sticky top-0 z-50 animate-fade-in transition-transform duration-200",
          isHidden && "-translate-y-full"
        )}
      >
        <div className="relative border-b border-border/70 bg-background/90 px-3 py-2.5 backdrop-blur-xl sm:px-4 max-[430px]:px-2.5 max-[430px]:py-2">
          <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-2 sm:px-1">
            {/* Logo */}
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="GCK Confessions Home"
            >
              <motion.span
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.12 }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/45 bg-accent/12 max-[430px]:h-7 max-[430px]:w-7"
              >
                <Cpu className="h-4 w-4 text-accent max-[430px]:h-3.5 max-[430px]:w-3.5" strokeWidth={2} />
              </motion.span>
              <span className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.13em] max-[430px]:text-[0.64rem] max-[430px]:tracking-[0.11em]">GCK Confessions</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 max-[430px]:gap-1.5">
              <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
                <Link
                  href="/submit"
                  className="rounded-md border border-transparent px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-200 hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  Share
                </Link>
                <Link
                  href="/guidelines"
                  className="rounded-md border border-transparent px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-200 hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  Rules
                </Link>
              </nav>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
