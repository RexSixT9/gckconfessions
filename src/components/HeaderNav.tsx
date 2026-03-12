"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export default function HeaderNav() {
  const headerRef = useRef<HTMLElement>(null);

  // Keep --header-height CSS variable accurate at all times
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () =>
      document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50 animate-fade-in">
        <AnnouncementBanner />

        {/* Floating pill wrapper */}
        <div className="relative px-3 pb-1.5 pt-2 sm:px-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-border/50 bg-background/85 px-3.5 py-2.5 shadow-sm backdrop-blur-xl sm:px-5">

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
