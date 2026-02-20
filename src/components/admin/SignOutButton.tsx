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
      className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--accent))]/50 hover:text-[hsl(var(--accent))] disabled:opacity-50"
      aria-label="Sign out"
    >
      {loading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      Sign out
    </button>
  );
}
