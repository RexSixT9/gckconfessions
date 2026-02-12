"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, HeartHandshake, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
  ssr: true,
});

type Notice = { type: "error" | "success"; message: string } | null;

export default function SubmitPage() {
  const [message, setMessage] = useState("");
  const [music, setMusic] = useState("");
  const [website, setWebsite] = useState("");
  const [saveDraft, setSaveDraft] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const draftKey = "gckconfessions:draft";

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { message?: string; music?: string };
        if (parsed.message || parsed.music) {
          if (parsed.message) setMessage(parsed.message);
          if (parsed.music) setMusic(parsed.music);
          setHasDraft(true);
        }
      }
      setDraftError(false);
    } catch (error) {
      console.error("Draft load error:", error);
      setDraftError(true);
      setSaveDraft(false);
    }
  }, []);

  // Auto-save draft to localStorage when content changes
  useEffect(() => {
    if (!saveDraft) return;
    
    const timer = setTimeout(() => {
      try {
        if (message.trim() || music.trim()) {
          localStorage.setItem(draftKey, JSON.stringify({ message, music }));
          setHasDraft(true);
          setDraftError(false);
        }
      } catch (error) {
        console.error("Draft save error:", error);
        setDraftError(true);
      }
    }, 500); // Debounce saves by 500ms to avoid frequent writes

    return () => clearTimeout(timer);
  }, [message, music, saveDraft]);

  // Clear draft function
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setMessage("");
      setMusic("");
      setHasDraft(false);
      setDraftError(false);
    } catch (error) {
      console.error("Draft clear error:", error);
      setDraftError(true);
    }
  }, []);

  // Optimized input handlers with memoization
  const handleMessageChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.currentTarget.value);
  }, []);

  const handleMusicChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMusic(event.currentTarget.value);
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return; // Prevent double submission
    setNotice(null);

    setLoading(true);

    try {
      const submitData = { message, music, website };
      
      const response = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit confession.");
      }

      // Reset form - combine into one render
      setMessage("");
      setMusic("");
      setWebsite("");
      setHasDraft(false);
      // Clear draft from storage
      try {
        localStorage.removeItem(draftKey);
      } catch (error) {
        console.error("Draft clear error:", error);
      }
      setNotice({ type: "success", message: "Confession submitted successfully!" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setNotice({
          type: "error",
          message: "Request timeout. Please try again.",
        });
      } else {
        setNotice({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [message, music, website, loading]);

  const charCount = message.length;
  const charLimit = 500;

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <main className="flex-1">
        {/* Header Section */}
        <section className="border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/70">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-4 py-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]"></span>
                <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                  Anonymous • Reviewed
                </span>
              </div>
              <h1 className="text-balance wrap-break-word text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl lg:text-4xl">
                Submit a confession
              </h1>
              <p className="mx-auto max-w-2xl text-balance wrap-break-word text-base text-[hsl(var(--muted-foreground))] sm:text-lg">
                Short, clear, and anonymous. We review every post.
              </p>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="mx-auto w-full max-w-4xl overflow-x-hidden px-4 py-16 sm:px-6 sm:py-24">
          {/* Form Card */}
          <div className="rounded-3xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-5 shadow-sm sm:p-8 lg:p-10">
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
                    Confession
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
                  placeholder="Write your confession..."
                  maxLength={charLimit}
                  rows={8}
                  value={message}
                  onChange={handleMessageChange}
                  className="w-full rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--background))] px-4 py-3 text-sm placeholder:text-[hsl(var(--muted-foreground))]/70 outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/25"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Keep it respectful. 500 characters max.
                </p>
              </div>

              {/* Music Field */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-[hsl(var(--foreground))]">
                  Song (optional)
                </label>
                <input
                  id="music"
                  name="music"
                  type="text"
                  value={music}
                  onChange={handleMusicChange}
                  maxLength={120}
                  placeholder="Add a song or artist"
                  className="w-full wrap-break-word rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--background))] px-4 py-3 text-sm placeholder:text-[hsl(var(--muted-foreground))] outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/20"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Optional.</p>
              </div>

              {/* Info Banner */}
              <div className="flex gap-3 rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))] p-4">
                <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--accent))]" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="wrap-break-word text-sm font-semibold text-[hsl(var(--foreground))]">
                    Anonymous by default
                  </p>
                  <p className="wrap-break-word text-xs text-[hsl(var(--muted-foreground))]">
                    No accounts. Reviewed before publishing.
                  </p>
                </div>
              </div>

              {/* Save Draft Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Save draft locally</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {draftError
                      ? "Storage not available"
                      : hasDraft && saveDraft
                      ? "Draft saved"
                      : "Keeps your text if you refresh."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSaveDraft((prev) => !prev)}
                    disabled={draftError}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
                      draftError
                        ? "border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 opacity-60 cursor-not-allowed"
                        : saveDraft
                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))]"
                    }`}
                    aria-pressed={saveDraft}
                    aria-label="Toggle save draft"
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        saveDraft ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  {hasDraft && saveDraft && !draftError && (
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="text-xs font-medium text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--destructive))] border border-[hsl(var(--border))]/70 rounded-full px-3 py-1"
                      title="Clear draft"
                    >
                      Clear
                    </button>
                  )}
                  {draftError && (
                    <span className="text-xs font-medium text-[hsl(var(--destructive))]" title="Storage error">
                      Storage unavailable
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full rounded-full bg-[hsl(var(--accent))] py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-sm transition disabled:opacity-50 hover:opacity-90 sm:py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Submitting
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4" />
                    Submit
                  </span>
                )}
              </button>

              {/* Success Notice */}
              {notice?.type === "success" && (
                <div className="flex gap-3 rounded-2xl border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/8 p-4 text-sm text-[hsl(var(--success))] dark:border-[hsl(var(--success))]/50 dark:bg-[hsl(var(--success))]/10 dark:text-[hsl(var(--success))]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Submitted</p>
                    <p className="mt-1 text-xs opacity-90">We will review it soon.</p>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {notice?.type === "error" && (
                <div className="flex gap-3 rounded-2xl border border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/8 p-4 text-sm text-[hsl(var(--destructive))] dark:border-[hsl(var(--destructive))]/50 dark:bg-[hsl(var(--destructive))]/10 dark:text-[hsl(var(--destructive))]">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Something went wrong</p>
                    <p className="mt-1 text-xs opacity-90">{notice.message}</p>
                  </div>
                </div>
              )}

              {/* Back Link */}
              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))]/80 px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] shadow-sm transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
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
