"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  // Tracks the theme that was just applied so the notification is always accurate
  const [notificationIsDark, setNotificationIsDark] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const handleThemeToggle = () => {
    const activeTheme = resolvedTheme ?? theme;
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    const newIsDark = newTheme === "dark";
    setTheme(newTheme);

    // Capture the new state before re-render so the notification is correct
    setNotificationIsDark(newIsDark);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  if (!mounted) {
    return null;
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleThemeToggle}
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))] focus-visible:outline-none sm:min-h-0 sm:min-w-0"
        aria-label="Toggle theme"
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? <Sun className="h-4 w-4 sm:h-4 sm:w-4" /> : <Moon className="h-4 w-4 sm:h-4 sm:w-4" />}
      </button>

      {/* Theme Preference Notification */}
      {showNotification && (
        <div className="absolute right-0 top-12 z-50 animate-slide-down whitespace-nowrap rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-medium text-[hsl(var(--foreground))]">
            {notificationIsDark ? '\uD83C\uDF19 Dark mode' : '\u2600\uFE0F Light mode'} saved
          </p>
        </div>
      )}
    </div>
  );
}
