"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
  /** Phrases to cycle through */
  phrases: string[];
  className?: string;
  /** Custom className for the blinking cursor (default: bg-current) */
  cursorClassName?: string;
  /** ms per character while typing */
  typingSpeed?: number;
  /** ms per character while deleting */
  deletingSpeed?: number;
  /** ms to pause after fully typed */
  pauseAfterType?: number;
  /** ms to pause after fully deleted before next phrase */
  pauseAfterDelete?: number;
  /** Initial delay before first character appears */
  startDelay?: number;
  /** If true, animate even when prefers-reduced-motion is enabled. */
  forceAnimate?: boolean;
}

export default function TypewriterText({
  phrases,
  className = "",
  cursorClassName,
  typingSpeed = 60,
  deletingSpeed = 30,
  pauseAfterType = 2000,
  pauseAfterDelete = 350,
  startDelay = 600,
  forceAnimate = false,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");

  // All mutable loop state lives in refs — no stale-closure issues
  const phraseIdx = useRef(0);
  const charCount = useRef(0);
  const isDeleting = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a stable ref to the latest phrases array
  const phrasesRef = useRef(phrases);
  useEffect(() => {
    phrasesRef.current = phrases;
    phraseIdx.current = 0;
    charCount.current = 0;
    isDeleting.current = false;
    setDisplayed("");
  }, [phrases]);

  useEffect(() => {
    if (!phrasesRef.current.length) {
      setDisplayed("");
      return;
    }

    // Respect reduced-motion: show first phrase with a deferred state update.
    if (!forceAnimate && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timerRef.current = setTimeout(() => {
        setDisplayed(phrasesRef.current[0] ?? "");
      }, 0);
      return;
    }

    const tick = () => {
      const phrase = phrasesRef.current[phraseIdx.current] ?? "";

      if (!isDeleting.current) {
        // --- TYPING FORWARD ---
        charCount.current = Math.min(charCount.current + 1, phrase.length);
        setDisplayed(phrase.slice(0, charCount.current));

        if (charCount.current === phrase.length) {
          // Fully typed → pause, then start deleting
          timerRef.current = setTimeout(() => {
            isDeleting.current = true;
            tick();
          }, pauseAfterType);
        } else {
          timerRef.current = setTimeout(tick, typingSpeed);
        }
      } else {
        // --- DELETING ---
        charCount.current = Math.max(charCount.current - 1, 0);
        setDisplayed(phrase.slice(0, charCount.current));

        if (charCount.current === 0) {
          // Fully deleted → pause, advance phrase, start typing again
          timerRef.current = setTimeout(() => {
            isDeleting.current = false;
            phraseIdx.current = (phraseIdx.current + 1) % Math.max(1, phrasesRef.current.length);
            tick();
          }, pauseAfterDelete);
        } else {
          timerRef.current = setTimeout(tick, deletingSpeed);
        }
      }
    };

    timerRef.current = setTimeout(tick, startDelay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [deletingSpeed, forceAnimate, pauseAfterDelete, pauseAfterType, startDelay, typingSpeed]);

  return (
    <span className={`inline-block min-h-[1.2em] ${className}`}>
      {displayed}
      {/* Blinking cursor — pure CSS, zero JS overhead */}
      <span
        aria-hidden
        className={`animate-cursor-blink ml-px inline-block h-[0.85em] w-[2.5px] translate-y-[0.05em] rounded-[1px] align-middle ${cursorClassName ?? "bg-current"}`}
      />
    </span>
  );
}
