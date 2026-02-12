"use client";

import { useState, useCallback, useEffect, useLayoutEffect } from "react";
import { X } from "lucide-react";

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

  useLayoutEffect(() => {
    const handleInit = () => {
      setIsVisible(getBannerVisibility());
    };
    handleInit();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isVisible === null) return;

    document.documentElement.style.setProperty(
      "--announcement-height",
      isVisible ? "2.5rem" : "0px"
    );

    return () => {
      document.documentElement.style.setProperty("--announcement-height", "0px");
    };
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
    <div className="w-full border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 text-[hsl(var(--foreground))] animate-slide-down">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <p className="flex-1 text-center text-xs font-medium sm:text-sm">
          New: posts are reviewed before publishing.{" "}
          <a href="/submit" className="font-semibold text-[hsl(var(--accent))] underline underline-offset-2 transition hover:opacity-80">
            Share now
          </a>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-[hsl(var(--accent))]/10 active:scale-95"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close announcement</span>
        </button>
      </div>
    </div>
  );
}
