"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        void registration.update();

        let hasRefreshed = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (hasRefreshed) return;
          hasRefreshed = true;
          window.location.reload();
        });
      } catch (error) {
        console.warn("Service worker registration failed", error);
      }
    };

    void register();
  }, []);

  return null;
}
