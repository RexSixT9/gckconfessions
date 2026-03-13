"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-right"
      theme="system"
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
