"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function SonnerToaster() {
  const [position, setPosition] = useState<"top-center" | "bottom-center" | "bottom-right">(
    "bottom-right"
  );

  useEffect(() => {
    const mobileMq = window.matchMedia("(max-width: 640px)");
    const tabletMq = window.matchMedia("(max-width: 1024px)");

    const updatePosition = () => {
      if (mobileMq.matches) {
        setPosition("top-center");
        return;
      }

      if (tabletMq.matches) {
        setPosition("bottom-center");
        return;
      }

      setPosition("bottom-right");
    };

    updatePosition();

    const onChange = () => updatePosition();
    mobileMq.addEventListener("change", onChange);
    tabletMq.addEventListener("change", onChange);

    return () => {
      mobileMq.removeEventListener("change", onChange);
      tabletMq.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <Toaster
      position={position}
      theme="system"
      richColors={false}
      closeButton={false}
      duration={4000}
      gap={8}
      toastOptions={{
        classNames: {
          toast: "sonner-toast",
          title: "sonner-title",
          description: "sonner-description",
          actionButton: "sonner-action",
        },
      }}
    />
  );
}
