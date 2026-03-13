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
          "rounded-xl border border-border/60 bg-background/80 text-foreground shadow-md backdrop-blur-xl",
        descriptionClassName: "text-muted-foreground",
      }}
    />
  );
}
