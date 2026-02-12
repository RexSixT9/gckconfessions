"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader, Lock, Mail, Eye, EyeOff } from "lucide-react";

type Notice = { type: "error" | "success"; message: string } | null;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      setNotice({ type: "success", message: "Login successful. Redirecting..." });
      setTimeout(() => router.push("/admin"), 1000);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm transition-all duration-300 hover:shadow-md lg:max-w-lg">
          {/* Header Section */}
          <div className="border-b border-[hsl(var(--border))] bg-linear-to-r from-[hsl(var(--accent))]/10 to-transparent px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Lock className="h-6 w-6 text-[hsl(var(--accent))]" />
            </div>
            <h1 className="text-center text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
              Admin Access
            </h1>
            <p className="mt-2 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Sign in to manage confessions
            </p>
          </div>

          {/* Form Section */}
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {/* Notice */}
            {notice && (
              <div
                className={`mb-6 flex items-center gap-3 rounded-lg border p-4 text-sm ${
                  notice.type === "error"
                    ? "border-red-200/50 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300"
                    : "border-green-200/50 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300"
                }`}
              >
                {notice.type === "error" ? (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                )}
                <p>{notice.message}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label
                  className="block text-sm font-semibold text-[hsl(var(--foreground))]"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@college.com"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-11 pr-4 py-3 text-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  className="block text-sm font-semibold text-[hsl(var(--foreground))]"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-11 pr-12 py-3 text-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full rounded-lg bg-[hsl(var(--accent))] py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 mt-8 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          GCK Confessions Admin Portal
        </p>
      </div>
    </div>
  );
}
