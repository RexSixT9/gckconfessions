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
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">

          {/* Page header */}
          <div className="mb-6 animate-slide-up">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--accent))]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
              Submit a confession
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Anonymous Â· Reviewed before publishing
            </p>
          </div>

          {/* Form card */}
          <div className="bento-cell p-6 sm:p-8 animate-slide-up animation-delay-100">
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
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="confession" className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    Confession
                  </label>
                  <span className={`text-xs ${charCount > charLimit * 0.9 ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    {charCount} / {charLimit}
                  </span>
                </div>
                <textarea
                  id="confession"
                  name="confession"
                  placeholder="Write your confessionâ€¦"
                  maxLength={charLimit}
                  rows={6}
                  value={message}
                  onChange={handleMessageChange}
                  className="input-base w-full resize-none"
                />
              </div>

              {/* Music */}
              <div>
                <label htmlFor="music" className="mb-1.5 block text-sm font-semibold text-[hsl(var(--foreground))]">
                  Song <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span>
                </label>
                <input
                  id="music"
                  name="music"
                  type="text"
                  value={music}
                  onChange={handleMusicChange}
                  maxLength={120}
                  placeholder="Artist â€“ Song title"
                  className="input-base w-full"
                />
              </div>

              {/* Draft toggle row */}
              <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Save draft locally</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {draftError ? "Storage unavailable" : hasDraft && saveDraft ? "Draft saved" : "Restores text on refresh"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveDraft((p) => !p)}
                    disabled={draftError}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${saveDraft ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--secondary))]'}`}
                    aria-pressed={saveDraft}
                    aria-label="Toggle save draft"
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${saveDraft ? 'translate-x-4' : 'translate-x-0.5'}`} />
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
              {notice?.type === 'success' && (
                <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3.5 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{notice.message}</p>
                </div>
              )}
              {notice?.type === 'error' && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{notice.message}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--accent))] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Submittingâ€¦
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Submit confession
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info note */}
          <div className="mt-3 flex items-start gap-2 px-1 animate-slide-up animation-delay-200">
            <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--accent))]" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Every submission is reviewed by a moderator before being published.
            </p>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
