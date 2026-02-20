"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AlertCircle, CheckCircle2, Loader, ShieldCheck, Mail, Eye, EyeOff, KeyRound } from "lucide-react";
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

  // Refs for GSAP animations (hooks must be called unconditionally).
  // Pass isChecking as a dep so the animation fires once it resolves
  // and the card is actually in the DOM.
  const cardContainerRef = useRef<HTMLDivElement>(null);
  useScaleEntrance(cardContainerRef, { duration: 0.45, delay: 0.05, deps: [isChecking] });

  if (isChecking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader className="h-5 w-5 animate-spin text-[hsl(var(--accent))]" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
      <div ref={cardContainerRef} className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <ShieldCheck className="h-6 w-6 text-[hsl(var(--foreground))]" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">Access moderation tools</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
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

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-[hsl(var(--muted-foreground))]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email" name="email" type="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck="false"
                    maxLength={254} required disabled={loading}
                    className="input-base w-full pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-[hsl(var(--muted-foreground))]">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="password" name="password" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password" autoCapitalize="off" autoCorrect="off" spellCheck="false"
                    maxLength={128} required disabled={loading}
                    className="input-base w-full pl-10 pr-10"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-[calc(var(--radius)*0.85)] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] disabled:opacity-50"
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
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--foreground))] py-2.5 text-sm font-semibold text-[hsl(var(--background))] transition-all duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
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
