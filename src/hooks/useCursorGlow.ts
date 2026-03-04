"use client";

import { useEffect, useRef } from "react";

/**
 * Hook that creates a cursor-following glow effect on a card element.
 * Updates CSS custom properties for mouse position relative to the card.
 */
export function useCursorGlow() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element

      // Set CSS custom properties
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleMouseLeave = () => {
      // Optional: reset on leave or let it fade naturally
      card.style.setProperty("--mouse-x", "-9999px");
      card.style.setProperty("--mouse-y", "-9999px");
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return cardRef;
}
