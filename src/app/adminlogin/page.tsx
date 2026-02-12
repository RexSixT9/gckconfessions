"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Notice = { type: "error" | "success"; message: string } | null;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      setNotice({ type: "success", message: "Login successful." });
      router.push("/admin");
    } catch (error) {
      // Debug-only: show exact error in UI during testing.
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
        <div className="rounded-(--radius) border bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))] shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Enter your admin email and password.
          </p>

          {notice && (
            <div
              className={`mt-6 rounded-[calc(var(--radius)-0.2rem)] border px-4 py-3 text-xs ${
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {notice.message}
            </div>
          )}

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@college.com"
                className="mt-2 w-full rounded-[calc(var(--radius)-0.2rem)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-[calc(var(--radius)-0.2rem)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-sm transition hover:opacity-90"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
