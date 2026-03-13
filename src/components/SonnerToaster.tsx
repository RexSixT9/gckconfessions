"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function SonnerToaster() {
  const { resolvedTheme } = useTheme();
  const toasterTheme =
    resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "system";

  return (
    <Toaster
      position="bottom-right"
      theme={toasterTheme}
      richColors={false}
      closeButton={false}
      duration={4000}
      gap={8}
      toastOptions={{
        className:
          "rounded-xl border border-border/70 bg-background text-foreground shadow-md",
        descriptionClassName: "text-muted-foreground",
      }}
    />
  );
}
