"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon-sm" aria-label="Toggle theme" disabled className="opacity-0" />;
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="rounded-xl border border-border text-foreground hover:border-accent/60 hover:bg-accent/12 hover:text-accent focus-visible:ring-ring/60 max-[430px]:size-8"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100 max-[430px]:h-[1.05rem] max-[430px]:w-[1.05rem]" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100 max-[430px]:h-[1.05rem] max-[430px]:w-[1.05rem]" />
      )}
    </Button>
  );
}
