"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-right"
      theme="system"
      richColors={false}
      closeButton={false}
      duration={3000}
      toastOptions={{
        className:
          "rounded-2xl border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-xl",
        descriptionClassName: "text-muted-foreground",
      }}
    />
  );
}
