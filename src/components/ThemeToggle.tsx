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
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle theme"
        disabled
        className="size-8 shrink-0 rounded-xl border border-border/90 bg-card text-foreground/80 opacity-100"
      >
        <Sun className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.1} />
      </Button>
    );
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="size-8 shrink-0 rounded-xl border border-border bg-card text-foreground shadow-sm ring-1 ring-border/40 hover:border-foreground/35 hover:bg-muted/55 hover:text-foreground focus-visible:ring-ring/60 max-[430px]:size-8"
    >
      {isDark ? (
        <Sun className="h-[1.05rem] w-[1.05rem] transition-transform duration-200 rotate-0 scale-100" strokeWidth={2.1} />
      ) : (
        <Moon className="h-[1.05rem] w-[1.05rem] transition-transform duration-200 rotate-0 scale-100" strokeWidth={2.1} />
      )}
    </Button>
  );
}
