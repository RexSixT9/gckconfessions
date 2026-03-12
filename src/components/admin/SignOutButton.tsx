"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        router.replace("/adminlogin");
        router.refresh();
        return;
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setLoading(false);
    }

    router.replace("/adminlogin");
    router.refresh();
  }, [loading, router]);

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSignOut}
      disabled={loading}
      title="Sign out"
      aria-label="Sign out"
      className="shrink-0 rounded-lg"
    >
      {loading ? <Loader className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
