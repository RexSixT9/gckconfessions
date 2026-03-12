"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader, ShieldCheck, Mail, Eye, EyeOff, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageReveal } from "@/components/Reveal";


type Notice = { type: "error" | "success"; message: string } | null;
const MIN_PASSWORD_LENGTH = 12;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

        const data = (await response.json().catch(() => ({}))) as {
          authenticated?: boolean;
        };

        if (response.ok && data.authenticated) {
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
    if (loading) return;

    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setNotice({ type: "error", message: "Enter a valid admin email address." });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setNotice({ type: "error", message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: normalizedEmail, password }),
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
        <Loader className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <PageReveal className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12" y={8} duration={0.4}>
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
          className="mb-6 text-center"
        >
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card"
          >
            <ShieldCheck className="h-6 w-6 text-foreground" />
          </motion.span>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Access moderation tools</p>
        </motion.div>

        {/* Card */}
        <Card className="border-shine border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {/* Notice */}
            <AnimatePresence mode="wait">
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                    notice.type === "error"
                      ? "border-destructive/30 bg-destructive/8 text-destructive"
                      : "border-green-500/30 bg-green-500/8 text-green-700 dark:text-green-400"
                  }`}
                >
                  {notice.type === "error" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <p>{notice.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={254}
                    required
                    disabled={loading}
                    className="h-10 border-border/70 bg-background pl-9 shadow-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={128}
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                    disabled={loading}
                    className="h-10 border-border/70 bg-background pl-9 pr-10 shadow-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 h-full w-10 rounded-l-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading || !email.trim() || password.length < MIN_PASSWORD_LENGTH}
                className="mt-2 w-full rounded-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 text-center text-xs text-muted-foreground"
        >
          GCK Confessions · Admin
        </motion.p>
      </motion.div>
    </PageReveal>
  );
}
