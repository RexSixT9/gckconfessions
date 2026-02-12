"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 text-[hsl(var(--foreground))]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <p className="flex-1 text-center text-xs font-medium sm:text-sm">
          New: posts are reviewed before publishing.{" "}
          <a href="/submit" className="font-semibold text-[hsl(var(--accent))] underline underline-offset-2">
            Share now
          </a>
        </p>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[hsl(var(--accent))]/10"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}
