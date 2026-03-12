"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageReveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";

const CHAR_LIMIT = 1000;
const DRAFT_KEY = "gckconfessions:draft";
const OFFLINE_QUEUE_KEY = "gckconfessions:offline-queue";

type DraftPayload = {
  message?: string;
  music?: string;
};

export default function SubmitPage() {
  const [message, setMessage] = useState("");
  const [music, setMusic] = useState("");
  const [website, setWebsite] = useState("");
  const [saveDraft, setSaveDraft] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [loading, setLoading] = useState(false);

  const queueOfflineSubmission = useCallback((payload: DraftPayload) => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as DraftPayload[]) : [];
      queue.push(payload);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-8)));
      setHasDraft(true);
      toast.info("Saved offline", {
        description: "Your confession is queued and will auto-send when back online.",
      });
    } catch {
      toast.error("Offline queue failed", {
        description: "Could not save this offline submission.",
      });
    }
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw) as DraftPayload[];
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining: DraftPayload[] = [];
      for (const item of queue) {
        const response = await fetch("/api/confessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: item.message ?? "", music: item.music ?? "", website: "" }),
        });

        if (!response.ok) {
          remaining.push(item);
        }
      }

      if (remaining.length === 0) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        toast.success("Offline queue synced", {
          description: "Queued confessions were submitted successfully.",
        });
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      }
    } catch {
      // Silent: a follow-up online event will retry.
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as DraftPayload;
      if (parsed.message) setMessage(parsed.message);
      if (parsed.music) setMusic(parsed.music);
      if (parsed.message || parsed.music) setHasDraft(true);
    } catch {
      setDraftError(true);
      setSaveDraft(false);
    }
  }, []);

  useEffect(() => {
    if (!saveDraft) return;

    const timer = setTimeout(() => {
      try {
        if (!message.trim() && !music.trim()) {
          localStorage.removeItem(DRAFT_KEY);
          setHasDraft(false);
          return;
        }

        localStorage.setItem(DRAFT_KEY, JSON.stringify({ message, music }));
        setHasDraft(true);
      } catch {
        setDraftError(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [message, music, saveDraft]);

  useEffect(() => {
    if (saveDraft) return;

    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    } catch {
      setDraftError(true);
    }
  }, [saveDraft]);

  useEffect(() => {
    const handleOnline = () => {
      void syncOfflineQueue();
    };

    window.addEventListener("online", handleOnline);
    void syncOfflineQueue();

    return () => window.removeEventListener("online", handleOnline);
  }, [syncOfflineQueue]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setMessage("");
      setMusic("");
      setHasDraft(false);
      setDraftError(false);
    } catch {
      setDraftError(true);
    }
  }, []);

  const fireConfetti = useCallback(async () => {
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: ["#c02051", "#e84d84", "#f9a8c9", "#ffffff"],
      disableForReducedMotion: true,
    });
  }, []);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (loading) return;

      setLoading(true);
      try {
        if (!navigator.onLine) {
          queueOfflineSubmission({ message, music });
          setLoading(false);
          return;
        }

        const response = await fetch("/api/confessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, music, website }),
          signal: AbortSignal.timeout(10000),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to submit confession.");

        setMessage("");
        setMusic("");
        setWebsite("");
        setHasDraft(false);
        localStorage.removeItem(DRAFT_KEY);

        toast.success("Confession submitted", {
          description: "A human moderator will review it before publishing.",
        });

        void fireConfetti();
      } catch (error) {
        const messageText =
          error instanceof Error && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : error instanceof Error
              ? error.message
              : "Unknown error. Please try again.";

        toast.error("Submission failed", { description: messageText });
      } finally {
        setLoading(false);
      }
    },
    [message, music, website, loading, fireConfetti, queueOfflineSubmission]
  );

  const charCount = useMemo(() => message.length, [message]);

  const guidanceText = useMemo(() => {
    if (charCount < 30) return "Add a bit more context for faster review.";
    if (charCount > CHAR_LIMIT * 0.9) return "You are near the limit. Keep only what matters.";
    return "Looks good. Keep it clear and anonymous.";
  }, [charCount]);

  const canSubmit = Boolean(message.trim()) && !loading;

  return (
    <main className="flex-1 bg-background">
      <PageReveal className="mx-auto w-full max-w-3xl px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/" />}
          className="group mb-6 gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2 backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-accent/5"
        >
          <>
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </>
        </Button>

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">Share your confession</CardTitle>
            <CardDescription>
              Keep it anonymous and clear. A moderator reviews every submission before publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="hidden"
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="confession" className="text-sm font-medium">
                      Your confession
                    </Label>
                    <span
                      className={cn(
                        "text-xs tabular-nums text-muted-foreground",
                        charCount > CHAR_LIMIT * 0.9 && "font-medium text-destructive"
                      )}
                    >
                      {charCount}/{CHAR_LIMIT}
                    </span>
                  </div>
                  <Textarea
                    id="confession"
                    name="confession"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={CHAR_LIMIT}
                    rows={10}
                    className="min-h-52 resize-none border-border/70 bg-background text-sm leading-6 shadow-none"
                    placeholder="What has been on your mind?"
                  />
                  <p className="text-xs text-muted-foreground">{guidanceText}</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="music" className="text-sm font-medium">
                      Song for this confession
                    </Label>
                    <Input
                      id="music"
                      name="music"
                      value={music}
                      onChange={(event) => setMusic(event.target.value)}
                      maxLength={120}
                      placeholder="Artist - Song"
                      className="h-10 border-border/70 bg-background shadow-none"
                    />
                    <p className="text-xs text-muted-foreground">Optional.</p>
                </div>

                <div className="rounded-lg border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Draft</p>
                      <p className="text-xs text-muted-foreground">
                        {draftError
                          ? "Local storage is unavailable on this device."
                          : hasDraft && saveDraft
                            ? "Draft saved on this device."
                            : "Auto-save available while you write."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={saveDraft ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSaveDraft((prev) => !prev)}
                        disabled={draftError}
                      >
                        {saveDraft ? "Auto-save on" : "Auto-save off"}
                      </Button>
                      {hasDraft && (
                        <Button type="button" variant="ghost" size="sm" onClick={clearDraft}>
                          Clear draft
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" size="lg" className="h-auto w-full gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:w-auto" disabled={!canSubmit}>
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit confession
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
        </Card>
      </PageReveal>
    </main>
  );
}
