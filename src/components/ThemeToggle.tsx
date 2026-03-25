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
        className="size-9 shrink-0 rounded-xl border border-border bg-card text-foreground/85 opacity-100 max-[430px]:size-9"
      >
        <Sun className="h-[1.15rem] w-[1.15rem] max-[430px]:h-[1.2rem] max-[430px]:w-[1.2rem]" strokeWidth={2.3} />
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
      className="size-9 shrink-0 rounded-xl border border-border bg-card text-foreground shadow-sm ring-1 ring-border/55 hover:border-foreground/35 hover:bg-muted/55 hover:text-foreground focus-visible:ring-ring/60 max-[430px]:size-9"
    >
      {isDark ? (
        <Sun className="h-[1.15rem] w-[1.15rem] transition-transform duration-200 rotate-0 scale-100 max-[430px]:h-[1.2rem] max-[430px]:w-[1.2rem]" strokeWidth={2.3} />
      ) : (
        <Moon className="h-[1.15rem] w-[1.15rem] transition-transform duration-200 rotate-0 scale-100 max-[430px]:h-[1.2rem] max-[430px]:w-[1.2rem]" strokeWidth={2.3} />
      )}
    </Button>
  );
}
