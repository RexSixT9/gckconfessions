"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, ArrowLeft, Lock, Music2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import CursorGlowCard from "@/components/CursorGlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const CHAR_LIMIT = 1000;

export default function SubmitPage() {
  const [message, setMessage] = useState("");
  const [music, setMusic] = useState("");
  const [website, setWebsite] = useState("");
  const [saveDraft, setSaveDraft] = useState(true);
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

  // Fire confetti on success (dynamically imported for bundle efficiency)
  const fireConfetti = useCallback(async () => {
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 130,
      spread: 75,
      origin: { y: 0.65 },
      colors: ["#c02051", "#e84d84", "#f9a8c9", "#ffffff"],
      disableForReducedMotion: true,
    });
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return; // Prevent double submission

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
      toast.success("Confession submitted!", {
        description: "It\'s in the queue — a human will review it before it goes live.",
      });
      void fireConfetti();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.error("Request timed out", {
          description: "Please check your connection and try again.",
        });
      } else {
        toast.error("Submission failed", {
          description: error instanceof Error ? error.message : "Unknown error — please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [message, music, website, loading, fireConfetti]);

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
            <Button variant="ghost" size="sm" render={<Link href="/" />} className="mb-2 -ml-2 rounded-lg">
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Button>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Share your confession
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              100% anonymous — reviewed by a human before it goes live
            </p>
          </motion.div>

          {/* Form card */}
          <CursorGlowCard
            variants={itemVariants}
            className="card border-shine p-6 sm:p-8"
          >
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
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="confession" className="flex items-center gap-2 text-sm font-bold">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Your confession
                  </Label>
                  <span className={cn("text-xs font-medium tabular-nums transition", charCount > CHAR_LIMIT * 0.9 ? "font-bold text-destructive" : "text-muted-foreground")}>
                    {charCount} / {CHAR_LIMIT}
                  </span>
                </div>
                <TextareaAutosize
                  id="confession"
                  name="confession"
                  placeholder="What's been on your mind? Write it here — no one will know it's you…"
                  maxLength={CHAR_LIMIT}
                  minRows={5}
                  maxRows={16}
                  value={message}
                  onChange={handleMessageChange}
                  className="flex w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                />
              </div>

              {/* Music */}
              <div className="space-y-2">
                <Label htmlFor="music" className="flex items-center gap-2 text-sm font-bold">
                  <Music2 className="h-4 w-4 text-accent" />
                  Song that fits this moment
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="music"
                  name="music"
                  type="text"
                  value={music}
                  onChange={handleMusicChange}
                  maxLength={120}
                  placeholder="e.g. Taylor Swift – All Too Well"
                  className="h-10"
                />
              </div>

              {/* Draft toggle row */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Save draft locally</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {draftError ? "Storage unavailable" : hasDraft && saveDraft ? "Draft saved ✓" : "Restored automatically on refresh"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveDraft((p) => !p)}
                    disabled={draftError}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
                      saveDraft ? "border-accent bg-accent" : "border-border bg-background"
                    )}
                    aria-pressed={saveDraft}
                    aria-label="Toggle save draft"
                  >
                    <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", saveDraft ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                  {hasDraft && saveDraft && !draftError && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={clearDraft}
                      className="h-6 rounded px-1.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="relative">
                {loading && (
                  <span className="absolute inset-0 animate-ping rounded-lg bg-accent/20 duration-1000" />
                )}
                <Button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="relative w-full rounded-lg font-semibold"
                  size="default"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Sending your confession…
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Submit confession
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CursorGlowCard>

          {/* Moderation notice */}
          <CursorGlowCard
            variants={itemVariants}
            className="card border-shine mt-6 overflow-hidden"
          >
            {/* Top row */}
            <div className="flex items-start gap-4 p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">Reviewed before publishing</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Every confession is read by a moderator. Content that violates guidelines is never published.
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400">
                Safe
              </Badge>
            </div>
            {/* Stats strip */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              {[
                { icon: Lock, label: "Anonymous" },
                { icon: Heart, label: "No account" },
                { icon: Sparkles, label: "Queued review" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-3 py-3.5 sm:gap-2 sm:px-4">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
                </div>
              ))}
            </div>
          </CursorGlowCard>

        </div>
      </main>
    </motion.div>
  );
}
