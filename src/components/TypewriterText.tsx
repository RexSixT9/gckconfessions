"use client";

import { useState, useEffect, useRef, useMemo } from "react";

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
  /** Optional responsive character limits used to fit phrases on smaller screens. */
  responsiveMaxChars?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

function fitPhrase(phrase: string, maxChars: number) {
  if (phrase.length <= maxChars) return phrase;
  const safeLimit = Math.max(4, maxChars - 1);
  const clipped = phrase.slice(0, safeLimit);
  const lastWordBoundary = clipped.lastIndexOf(" ");
  const base = lastWordBoundary > 5 ? clipped.slice(0, lastWordBoundary) : clipped;
  return `${base}\u2026`;
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
  responsiveMaxChars,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [viewportWidth, setViewportWidth] = useState(1024);

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth || 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const maxChars = useMemo(() => {
    if (viewportWidth < 640) return responsiveMaxChars?.mobile ?? 16;
    if (viewportWidth < 1024) return responsiveMaxChars?.tablet ?? 24;
    return responsiveMaxChars?.desktop ?? 40;
  }, [responsiveMaxChars?.desktop, responsiveMaxChars?.mobile, responsiveMaxChars?.tablet, viewportWidth]);

  const preparedPhrases = useMemo(
    () => phrases.map((phrase) => fitPhrase(phrase, maxChars)),
    [phrases, maxChars]
  );

  // All mutable loop state lives in refs — no stale-closure issues
  const phraseIdx = useRef(0);
  const charCount = useRef(0);
  const isDeleting = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a stable ref to the latest phrases array
  const phrasesRef = useRef(preparedPhrases);
  useEffect(() => {
    phrasesRef.current = preparedPhrases;
    phraseIdx.current = 0;
    charCount.current = 0;
    isDeleting.current = false;
    setDisplayed("");
  }, [preparedPhrases]);

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
          const effectiveTypingSpeed = Math.max(
            22,
            Math.round(typingSpeed * Math.min(1, 16 / Math.max(phrase.length, 1)))
          );
          timerRef.current = setTimeout(tick, effectiveTypingSpeed);
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
          const effectiveDeletingSpeed = Math.max(
            16,
            Math.round(deletingSpeed * Math.min(1, 16 / Math.max(phrase.length, 1)))
          );
          timerRef.current = setTimeout(tick, effectiveDeletingSpeed);
        }
      }
    };

    timerRef.current = setTimeout(tick, startDelay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [deletingSpeed, forceAnimate, pauseAfterDelete, pauseAfterType, startDelay, typingSpeed]);

  return (
    <span className={`inline-block max-w-full min-h-[1.2em] whitespace-normal wrap-anywhere ${className}`}>
      {displayed}
      {/* Blinking cursor — pure CSS, zero JS overhead */}
      <span
        aria-hidden
        className={`animate-cursor-blink ml-px inline-block h-[0.85em] w-[2.5px] translate-y-[0.05em] rounded-[1px] align-middle ${cursorClassName ?? "bg-current"}`}
      />
    </span>
  );
}
