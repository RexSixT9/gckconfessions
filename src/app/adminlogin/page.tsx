"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Loader, ShieldCheck, Mail, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageReveal } from "@/components/Reveal";

const MIN_PASSWORD_LENGTH = 12;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Sign-in failed", {
        description: "Please enter a valid admin email address.",
      });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error("Sign-in failed", {
        description: `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
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
        throw new Error(data.error || "Could not sign you in.");
      }

      // Clear sensitive data from memory
      setPassword("");

      toast.success("Signed in", {
        description: "Welcome back. Taking you to the admin dashboard.",
      });
      setTimeout(() => {
        router.push("/admin");
      }, 300);
    } catch (error) {
      // Clear password on error for security
      setPassword("");

      toast.error("Sign-in failed", {
        description: error instanceof Error ? error.message : "Could not sign in. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex flex-1 items-center justify-center" role="status" aria-live="polite" aria-label="Checking your admin session">
        <Loader className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <main className="relative flex flex-1 bg-background" aria-labelledby="admin-login-title">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <PageReveal className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12" y={8} duration={0.4}>
        <div className="w-full max-w-sm">
          <Card className="border-border/70 bg-card/75 shadow-none backdrop-blur-sm">
            <CardHeader className="space-y-3 pb-2 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-background/70">
                <ShieldCheck className="h-6 w-6 text-foreground" />
              </span>
              <CardTitle id="admin-login-title" className="text-2xl font-black tracking-tight">Admin sign in</CardTitle>
              <CardDescription>Use your admin credentials to open moderation tools</CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-4 sm:p-8 sm:pt-5">
            <form className="space-y-5" onSubmit={handleSubmit} aria-busy={loading}>
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
                    size="icon-sm"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="brand"
                size="touch"
                disabled={loading || !email.trim() || password.length < MIN_PASSWORD_LENGTH}
                className="mt-2 w-full rounded-xl font-semibold shadow-none"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">GCK Confessions admin</p>
        </div>
      </PageReveal>
    </main>
  );
}
