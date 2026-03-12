"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { X, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const BANNER_STORAGE_KEY = "gck_announcement_dismissed";
const BANNER_RESET_DAYS = 3; // Reset banner every 3 days

function getBannerVisibility(): boolean {
  // Safely check if we're in browser
  if (typeof window === "undefined") return true;

  try {
    const stored = localStorage.getItem(BANNER_STORAGE_KEY);
    if (stored) {
      const dismissedTime = parseInt(stored, 10);
      const now = Date.now();
      const daysSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show banner again if more than BANNER_RESET_DAYS have passed
      if (daysSinceDismissal >= BANNER_RESET_DAYS) {
        localStorage.removeItem(BANNER_STORAGE_KEY);
        return true;
      }
      return false;
    }
    return true; // Banner hasn't been dismissed, show it
  } catch (error) {
    // Fallback if localStorage is unavailable
    console.warn("localStorage unavailable, showing banner by default", error);
    return true;
  }
}

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const handleInit = () => {
      setIsVisible(getBannerVisibility());
    };
    handleInit();
  }, []);

  // Set the CSS variable synchronously before paint so the hero section
  // never calculates its height with a stale --announcement-height value.
  useLayoutEffect(() => {
    if (typeof document === "undefined" || isVisible === null) return;
    const height = isVisible ? `${bannerRef.current?.offsetHeight ?? 0}px` : "0px";
    document.documentElement.style.setProperty("--announcement-height", height);
    return () => {
      document.documentElement.style.setProperty("--announcement-height", "0px");
    };
  }, [isVisible]);

  // Keep the CSS variable updated if the banner resizes (e.g. font scaling).
  useEffect(() => {
    if (!isVisible || !bannerRef.current || typeof ResizeObserver === "undefined") return;
    const el = bannerRef.current;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        "--announcement-height",
        `${el.offsetHeight}px`
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(BANNER_STORAGE_KEY, Date.now().toString());
    } catch (error) {
      console.warn("Failed to persist banner dismissal", error);
    }
    setIsVisible(false);
  }, []);

  // Prevent hydration mismatch by not rendering until hydrated
  if (isVisible === null) return null;
  if (!isVisible) return null;

  return (
    <div
      ref={bannerRef}
      className="w-full border-b border-border/70 bg-card/90 text-foreground animate-slide-down backdrop-blur-sm"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-2.5">
          {/* Event type pill */}
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent sm:inline-flex">
            <Megaphone className="h-2.5 w-2.5" />
            Event
          </span>
          <p className="min-w-0 text-center text-[11px] font-medium leading-snug sm:text-sm">
            <span className="font-semibold text-foreground">Confessions are open</span>
            <span className="hidden text-muted-foreground xs:inline"> — share yours anonymously today.</span>
            <span className="text-muted-foreground">&nbsp;</span>
            <a
              href="/submit"
              className="font-semibold text-accent underline underline-offset-2 transition hover:opacity-75"
            >
              Submit now
            </a>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="ml-0.5 h-7 w-7 shrink-0 rounded-full sm:ml-1"
          aria-label="Close announcement"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Close announcement</span>
        </Button>
      </div>
    </div>
  );
}
