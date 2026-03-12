"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function SonnerToaster() {
  const { resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <Toaster
      theme={resolvedTheme as "light" | "dark" | "system"}
      position={isMobile ? "top-center" : "bottom-right"}
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
