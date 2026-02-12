"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (response.ok || response.redirected) {
        router.replace("/");
        router.refresh();
        return;
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setLoading(false);
    }

    router.replace("/");
    router.refresh();
  }, [loading, router]);

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 px-4 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] whitespace-nowrap sm:w-auto disabled:opacity-60"
      aria-label="Sign out"
    >
      {loading ? <Loader className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Sign out
    </button>
  );
}
