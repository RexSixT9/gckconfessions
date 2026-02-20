"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft, Lock, Music2, Sparkles } from "lucide-react";
import { useStaggerEntrance } from "@/lib/gsap";

type Notice = { type: "error" | "success"; message: string } | null;

const CHAR_LIMIT = 500;

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

  const pageRef = useRef<HTMLDivElement>(null);
  useStaggerEntrance(pageRef, { selector: "[data-animate]", stagger: 0.08, duration: 0.5 });

  return (
    <div ref={pageRef} className="flex flex-1 flex-col">
      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">

          {/* Page header */}
          <div data-animate className="mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-2xl">
              Share your confession
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              100% anonymous — reviewed by a human before it goes live
            </p>
          </div>

          {/* Form card */}
          <div data-animate className="bento-cell p-5 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot */}
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

              {/* Textarea */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                  <label htmlFor="confession" className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--foreground))]">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                    Your confession
                  </label>
                  <span className={`text-xs tabular-nums transition ${charCount > CHAR_LIMIT * 0.9 ? 'font-semibold text-[hsl(var(--destructive))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {charCount} / {CHAR_LIMIT}
                  </span>
                </div>
                <textarea
                  id="confession"
                  name="confession"
                  placeholder="What's been on your mind? Write it here — no one will know it's you…"
                  maxLength={CHAR_LIMIT}
                  rows={5}
                  value={message}
                  onChange={handleMessageChange}
                  className="input-base w-full resize-none"
                />
              </div>

              {/* Music */}
              <div>
                <label htmlFor="music" className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--foreground))]">
                  <Music2 className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                  Song that fits this moment
                  <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span>
                </label>
                <input
                  id="music"
                  name="music"
                  type="text"
                  value={music}
                  onChange={handleMusicChange}
                  maxLength={120}
                  placeholder="e.g. Taylor Swift – All Too Well"
                  className="input-base w-full"
                />
              </div>

              {/* Draft toggle row */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Save draft locally</p>
                  <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                    {draftError ? "Storage unavailable" : hasDraft && saveDraft ? "Draft saved ✓" : "Restored automatically on refresh"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveDraft((p) => !p)}
                    disabled={draftError}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${saveDraft ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--background))]'}`}
                    aria-pressed={saveDraft}
                    aria-label="Toggle save draft"
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${saveDraft ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  {hasDraft && saveDraft && !draftError && (
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="text-xs text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--destructive))]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Notices */}
              {notice?.type === "success" && (
                <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3.5 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{notice.message}</p>
                </div>
              )}
              {notice?.type === "error" && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{notice.message}</p>
                </div>
              )}

              {/* Submit */}
              <div className="relative">
                {/* Pulse ring while submitting */}
                {loading && (
                  <span className="absolute inset-0 rounded-lg animate-ping bg-[hsl(var(--accent))]/20 duration-1000" />
                )}
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="relative inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--accent))] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending your confession…
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Submit confession
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Moderation notice — redesigned */}
          <div data-animate className="mt-4 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
            {/* Top row */}
            <div className="flex items-start gap-3 px-4 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--accent))]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Reviewed before publishing</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Every confession is read by a moderator. Content that violates guidelines is never published.
                </p>
              </div>
              <span className="ml-1 shrink-0 rounded-full bg-[hsl(var(--accent))]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--accent))]">
                Safe
              </span>
            </div>
            {/* Stats strip */}
            <div className="flex divide-x divide-[hsl(var(--border))] border-t border-[hsl(var(--border))]">
              {[
                { icon: Lock, label: "Anonymous" },
                { icon: Heart, label: "No account" },
                { icon: Sparkles, label: "Queued review" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5">
                  <Icon className="h-3 w-3 text-[hsl(var(--accent))]" />
                  <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}



