"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useRef } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { useFadeIn } from "@/lib/gsap";

export default function HeaderNav() {
  const ref = useRef<HTMLElement>(null);
  useFadeIn(ref, { y: -8, duration: 0.45 });

  return (
    <header
      ref={ref}
      className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-sm"
    >
      <AnnouncementBanner />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-lg px-1 py-1 text-[hsl(var(--foreground))] transition hover:opacity-80"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]">
            <Heart className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            GCK Confessions
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Write button — hidden on small screens (hero CTA is visible there) */}
          <Link
            href="/submit"
            className="hidden items-center gap-1 rounded-lg bg-[hsl(var(--accent))] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 sm:inline-flex"
          >
            Write
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
