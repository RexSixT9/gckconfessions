"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function SonnerToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme as "light" | "dark" | "system"}
      position="bottom-right"
      closeButton
      duration={4000}
      gap={8}
      toastOptions={{
        classNames: {
          toast: "sonner-toast",
          title: "sonner-title",
          description: "sonner-description",
          closeButton: "sonner-close",
          actionButton: "sonner-action",
          success: "sonner-success",
          error: "sonner-error",
          warning: "sonner-warning",
          info: "sonner-info",
        },
      }}
    />
  );
}
