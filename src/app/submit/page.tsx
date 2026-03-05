"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft, Lock, Music2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import CursorGlowCard from "@/components/CursorGlowCard";

type Notice = { type: "error" | "success"; message: string } | null;

const CHAR_LIMIT = 1000;

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
    }, 500); // Debounce saves by 500ms (limit is now 1000 chars)

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="flex flex-1 flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">

          {/* Page header */}
          <motion.div variants={itemVariants} className="mb-6">
            <Link
              href="/"
              className="btn-ghost"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
              Share your confession
            </h1>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              100% anonymous — reviewed by a human before it goes live
            </p>
          </motion.div>

          {/* Form card */}
          <CursorGlowCard
            variants={itemVariants}
            className="card border-shine p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="confession" className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--foreground))]">
                    <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
                    Your confession
                  </label>
                  <span className={`text-xs font-medium tabular-nums transition ${charCount > CHAR_LIMIT * 0.9 ? 'font-bold text-[hsl(var(--destructive))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
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
                <label htmlFor="music" className="mb-3 flex items-center gap-2 text-sm font-bold text-[hsl(var(--foreground))]">
                  <Music2 className="h-4 w-4 text-[hsl(var(--accent))]" />
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
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">Save draft locally</p>
                  <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
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
                <div className="notice notice-success">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{notice.message}</p>
                </div>
              )}
              {notice?.type === "error" && (
                <div className="notice notice-error">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{notice.message}</p>
                </div>
              )}

              {/* Submit */}
              <div className="relative">
                {/* Pulse ring while submitting */}
                {loading && (
                  <span className="absolute inset-0 animate-ping rounded-lg bg-[hsl(var(--accent))]/20 duration-1000" />
                )}
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="btn-primary relative w-full"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending your confession…
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5" />
                      Submit confession
                    </>
                  )}
                </button>
              </div>
            </form>
          </CursorGlowCard>

          {/* Moderation notice — redesigned */}
          <CursorGlowCard
            variants={itemVariants}
            className="card border-shine mt-6 overflow-hidden"
          >
            {/* Top row */}
            <div className="flex items-start gap-4 p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10">
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">Reviewed before publishing</p>
                <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Every confession is read by a moderator. Content that violates guidelines is never published.
                </p>
              </div>
              <span className="badge badge-success shrink-0">
                Safe
              </span>
            </div>
            {/* Stats strip */}
            <div className="grid grid-cols-3 divide-x divide-[hsl(var(--border))] border-t border-[hsl(var(--border))]">
              {[
                { icon: Lock, label: "Anonymous" },
                { icon: Heart, label: "No account" },
                { icon: Sparkles, label: "Queued review" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-3 py-3.5 sm:gap-2 sm:px-4">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--accent))]" />
                  <p className="truncate text-[11px] font-medium text-[hsl(var(--muted-foreground))] sm:text-xs">{label}</p>
                </div>
              ))}
            </div>
          </CursorGlowCard>

        </div>
      </main>
    </motion.div>
  );
}
