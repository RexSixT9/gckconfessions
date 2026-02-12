"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import Script from "next/script";

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
  ssr: true,
});

type Notice = { type: "error" | "success"; message: string } | null;

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (response: { response: string }) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string | number;
      reset: (widgetId?: string | number) => void;
    };
  }
}

export default function SubmitPage() {
  const [message, setMessage] = useState("");
  const [music, setMusic] = useState("");
  const [website, setWebsite] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<string | number | null>(null);
  const [captchaLoadError, setCaptchaLoadError] = useState(false);
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const hCaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";
  const [captchaEnabled, setCaptchaEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCaptchaEnabled(Boolean(hCaptchaSiteKey));
  }, [hCaptchaSiteKey]);

  useEffect(() => {
    if (!captchaReady || !hCaptchaSiteKey || !captchaRef.current || captchaWidgetId) return;
    if (!window.hcaptcha) return;

    const widgetId = window.hcaptcha.render(captchaRef.current, {
      sitekey: hCaptchaSiteKey,
      callback: (response: { response: string }) => setCaptchaToken(response.response),
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaToken(""),
    });

    setCaptchaWidgetId(widgetId);
  }, [captchaReady, hCaptchaSiteKey, captchaWidgetId]);

  useEffect(() => {
    if (!captchaEnabled || captchaReady) return;
    const timer = setTimeout(() => setCaptchaLoadError(true), 5000);
    return () => clearTimeout(timer);
  }, [captchaEnabled, captchaReady]);

  useEffect(() => {
    if (captchaReady) {
      setCaptchaLoadError(false);
    }
  }, [captchaReady]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (captchaEnabled && !captchaToken) {
      setNotice({ type: "error", message: "Please complete the verification." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, music, website, captchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit confession.");
      }

      setMessage("");
      setMusic("");
      setWebsite("");
      setCaptchaToken("");
      if (window.hcaptcha && captchaWidgetId !== null) {
        window.hcaptcha.reset(captchaWidgetId);
      }
      setNotice({ type: "success", message: "Confession submitted successfully!" });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error.",
      });
    } finally {
      setLoading(false);
    }
  }, [message, music, captchaToken, captchaWidgetId, website, captchaEnabled]);

  const charCount = message.length;
  const charLimit = 500;

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      {mounted && captchaEnabled && (
        <Script
          src="https://js.hcaptcha.com/1/api.js"
          strategy="afterInteractive"
          onLoad={() => {
            setCaptchaReady(true);
            setCaptchaLoadError(false);
          }}
          onError={() => setCaptchaLoadError(true)}
        />
      )}
      <main className="flex-1">
        {/* Header Section */}
        <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/8 px-4 py-2.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]" style={{boxShadow: '0 0 8px hsl(var(--accent))'}}></span>
                <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                  100% Private • Zero Tracing
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl lg:text-4xl">
                Share Your Confession
              </h1>
              <p className="mx-auto max-w-2xl text-base text-[hsl(var(--muted-foreground))] sm:text-lg">
                Anonymous, simple, and safe. Share what is on your mind.
              </p>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          {/* Form Card */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm sm:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <input
                type="text"
                name="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
              />
              {/* Confession Textarea */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <label className="text-base font-semibold text-[hsl(var(--foreground))]">
                    Your Confession
                  </label>
                  <span
                    className={`text-xs font-medium ${
                      charCount > charLimit * 0.9
                        ? 'text-[hsl(var(--destructive))]'
                        : 'text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {charCount} / {charLimit} characters
                  </span>
                </div>
                <textarea
                  id="confession"
                  name="confession"
                  placeholder="What's on your mind? Be honest and authentic..."
                  maxLength={charLimit}
                  rows={8}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm placeholder:text-[hsl(var(--muted-foreground))]/70 outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/25"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Be respectful. Spam or hateful content is removed.
                </p>
              </div>

              {/* Music Field */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-[hsl(var(--foreground))]">
                  Companion Song{' '}
                  <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">(optional)</span>
                </label>
                <input
                  id="music"
                  name="music"
                  type="text"
                  value={music}
                  onChange={(event) => setMusic(event.target.value)}
                  placeholder="e.g., 'Tear in the Club - The Weeknd'"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm placeholder:text-[hsl(var(--muted-foreground))] outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/20"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Add a song if you want.</p>
              </div>

              {/* Info Banner */}
              <div className="flex gap-3 rounded-xl border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/5 p-4">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--accent))]" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Your privacy is protected
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Anonymous. No accounts. Reviewed before posting.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !message.trim() || (captchaEnabled && !captchaToken)}
                className="w-full rounded-lg bg-[hsl(var(--accent))] py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-md transition disabled:opacity-50 hover:shadow-lg hover:opacity-90 sm:py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4" />
                    Submit Confession
                  </span>
                )}
              </button>

              {captchaEnabled && (
                <div className="flex items-center justify-center">
                  <div ref={captchaRef} />
                </div>
              )}

              {mounted && captchaEnabled && !captchaToken && (
                <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                  Complete the verification to submit.
                </p>
              )}

              {mounted && captchaEnabled && captchaLoadError && (
                <p className="text-center text-xs text-[hsl(var(--destructive))]">
                  Verification failed to load. Disable ad blockers or refresh the page.
                </p>
              )}

              {/* Success Notice */}
              {notice?.type === "success" && (
                <div className="flex gap-3 rounded-xl border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/8 p-4 text-sm text-[hsl(var(--success))] dark:border-[hsl(var(--success))]/50 dark:bg-[hsl(var(--success))]/10 dark:text-[hsl(var(--success))]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">{notice.message}</p>
                    <p className="mt-1 text-xs opacity-90">We will review it shortly.</p>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {notice?.type === "error" && (
                <div className="flex gap-3 rounded-xl border border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/8 p-4 text-sm text-[hsl(var(--destructive))] dark:border-[hsl(var(--destructive))]/50 dark:bg-[hsl(var(--destructive))]/10 dark:text-[hsl(var(--destructive))]">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Unable to submit</p>
                    <p className="mt-1 text-xs opacity-90">{notice.message}</p>
                  </div>
                </div>
              )}

              {/* Back Link */}
              <div className="text-center">
                <Link
                  href="/"
                  className="text-sm text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--accent))]"
                >
                  ← Back to home
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
