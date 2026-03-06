"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/**
 * Sonner Toaster that automatically matches the app's current light/dark theme.
 * Rendered once in the root layout.
 */
export function SonnerToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme as "light" | "dark" | "system"}
      position="bottom-center"
      richColors
      closeButton
      duration={4500}
      toastOptions={{
        style: {
          fontFamily: "var(--font-geist-sans)",
          borderRadius: "var(--radius)",
        },
      }}
    />
  );
}
