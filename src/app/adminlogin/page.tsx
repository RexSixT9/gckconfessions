"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader, ShieldCheck, Mail, Eye, EyeOff, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


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

  if (isChecking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader className="h-5 w-5 animate-spin text-[hsl(var(--accent))]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="w-full max-w-sm"
      >

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 text-center"
        >
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 200 }}
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
          >
            <ShieldCheck className="h-7 w-7 text-[hsl(var(--foreground))]" />
          </motion.span>
          <h1 className="text-2xl font-black tracking-tight text-[hsl(var(--foreground))]">Admin sign in</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Access moderation tools</p>
        </motion.div>

        {/* Card */}
        <div className="card border-shine p-6 sm:p-8">
          {/* Notice */}
          <AnimatePresence mode="wait">
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`notice mb-6 ${notice.type === 'error' ? 'notice-error' : 'notice-success'}`}
              >
                {notice.type === 'error' ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
                <p>{notice.message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-3 block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Email</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-[hsl(var(--muted-foreground))]">
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
              <label htmlFor="password" className="mb-3 block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-[hsl(var(--muted-foreground))]">
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
              className="btn-primary mt-6 w-full"
            >
              {loading ? <><Loader className="h-5 w-5 animate-spin" /> Signing in…</> : 'Sign in'}
            </button>
          </form>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]"
        >
          GCK Confessions · Admin
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
