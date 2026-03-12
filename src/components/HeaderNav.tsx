"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Heart, PenLine, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/guidelines", label: "Guidelines", icon: BookOpen },
];

/** Animated three-line hamburger that morphs into an × */
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative flex h-3.25 w-4.5 flex-col justify-between" aria-hidden>
      <motion.span
        className="block h-[1.5px] w-full origin-center rounded-full bg-current"
        animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.span
        className="block h-[1.5px] rounded-full bg-current"
        style={{ width: "70%" }}
        animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
      />
      <motion.span
        className="block h-[1.5px] w-full origin-center rounded-full bg-current"
        animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

export default function HeaderNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-50 animate-fade-in">
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

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/submit"
                className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1.5 font-semibold")}
              >
                <PenLine className="h-3.5 w-3.5" />
                Write
              </Link>
              <ThemeToggle />
            </div>

            {/* Mobile toggle */}
            <div className="flex items-center gap-1 sm:hidden">
              <ThemeToggle />
              <button
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}
              >
                <HamburgerIcon isOpen={menuOpen} />
              </button>
            </div>
          </div>

          {/* Mobile dropdown — absolutely positioned below pill */}
          <AnimatePresence>
            {menuOpen && (
              <motion.nav
                key="mobile-nav"
                role="navigation"
                aria-label="Mobile navigation"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-x-3 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-border/50 bg-background/97 p-2 shadow-xl backdrop-blur-xl sm:hidden"
              >
                {[
                  { href: "/submit", label: "Write a Confession", icon: PenLine, primary: true },
                  ...navLinks.map(({ href, label, icon }) => ({
                    href,
                    label,
                    icon,
                    primary: false,
                  })),
                ].map(({ href, label, icon: Icon, primary }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.14, delay: i * 0.05 }}
                  >
                    <Link
                      href={href}
                      onClick={closeMenu}
                      className={cn(
                        buttonVariants({
                          variant: primary ? "default" : "ghost",
                          size: "default",
                        }),
                        "mb-1 w-full justify-start rounded-xl"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Click-away backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 sm:hidden"
            onClick={closeMenu}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </>
  );
}
