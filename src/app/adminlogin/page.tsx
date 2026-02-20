"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AlertCircle, CheckCircle2, Loader, Heart, Mail, Eye, EyeOff, KeyRound } from "lucide-react";
import { useScaleEntrance } from "@/lib/gsap";

type Notice = { type: "error" | "success"; message: string } | null;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check", {
          method: "GET",
          credentials: "same-origin",
        });

        if (response.ok) {
          // User is already logged in, redirect to admin panel
          router.push("/admin");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      // Clear sensitive data from memory
      setPassword("");
      
      setNotice({ type: "success", message: "Signed in. Redirecting..." });
      setTimeout(() => {
        router.push("/admin");
      }, 1000);
    } catch (error) {
      // Clear password on error for security
      setPassword("");
      
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Sign-in failed. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refs for GSAP animations (hooks must be called unconditionally)
  const cardContainerRef = useRef<HTMLDivElement>(null);
  useScaleEntrance(cardContainerRef, { duration: 0.45, delay: 0.05 });

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
        <Loader className="h-5 w-5 animate-spin text-[hsl(var(--accent))]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div ref={cardContainerRef} className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
            <Heart className="h-5 w-5 text-[hsl(var(--accent))]" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">Admin sign in</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Access moderation tools</p>
        </div>

        {/* Card */}
        <div className="bento-cell p-6">
          {/* Notice */}
            {notice && (
              <div className={`mb-5 flex items-start gap-2.5 rounded-lg border p-3.5 text-sm ${
                notice.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400'
                  : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400'
              }`}>
                {notice.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                <p>{notice.message}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[hsl(var(--foreground))]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="email" name="email" type="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck="false"
                    maxLength={254} required disabled={loading}
                    className="input-base w-full pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[hsl(var(--foreground))]">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="password" name="password" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password" autoCapitalize="off" autoCorrect="off" spellCheck="false"
                    maxLength={128} required disabled={loading}
                    className="input-base w-full pl-9 pr-10"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))] disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--accent))] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <><Loader className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
              </button>
            </form>
        </div>

        <p className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">GCK Confessions · Admin</p>
      </div>
    </div>
  );
}
