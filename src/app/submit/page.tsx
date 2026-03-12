"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CircleCheck,
  Send,
  TriangleAlert,
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

type SafetyCheck = {
  ok: boolean;
  label: string;
};

type ToneLevel = "low" | "medium" | "high";

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

      const pendingSafety = [
        /\b\d{10,}\b/.test(message),
        /@\w+\.\w+/.test(message),
        /(https?:\/\/|www\.)/i.test(message),
      ].some(Boolean);

      if (pendingSafety) {
        toast.error("Safety check failed", {
          description: "Please remove phone numbers, links, or personal identifiers.",
        });
        return;
      }

      const lower = message.toLowerCase();
      const strongWords = ["hate", "kill", "worthless", "stupid", "die"];
      const toneHits = strongWords.filter((word) => lower.includes(word)).length;

      if (toneHits >= 2) {
        toast.error("Tone risk too high", {
          description: "Please soften hostile wording before submitting.",
        });
        return;
      }

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

  const toneLevel: ToneLevel = useMemo(() => {
    const lower = message.toLowerCase();
    const strongWords = ["hate", "kill", "worthless", "stupid", "die"];
    const hits = strongWords.filter((w) => lower.includes(w)).length;
    if (hits >= 2) return "high";
    if (hits === 1) return "medium";
    return "low";
  }, [message]);

  const safetyChecks: SafetyCheck[] = useMemo(
    () => [
      { ok: !/\b\d{10,}\b/.test(message), label: "No phone numbers" },
      { ok: !/@\w+\.\w+/.test(message), label: "No personal email" },
      { ok: !/(https?:\/\/|www\.)/i.test(message), label: "No external links" },
    ],
    [message]
  );

  const guidanceText = useMemo(() => {
    if (charCount < 30) return "Add a bit more context for faster review.";
    if (charCount > CHAR_LIMIT * 0.9) return "You are near the limit. Keep only what matters.";
    return "Looks good. Keep it clear and anonymous.";
  }, [charCount]);

  const checksPassed = safetyChecks.every((check) => check.ok);
  const canSubmit = Boolean(message.trim()) && checksPassed && toneLevel !== "high" && !loading;

  const toneStyle =
    toneLevel === "high"
      ? "text-destructive"
      : toneLevel === "medium"
        ? "text-warning"
        : "text-success";

  return (
    <main className="flex-1 bg-background">
      <PageReveal className="mx-auto w-full max-w-3xl px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/" />}
          className="mb-6 shrink-0 gap-1.5 rounded-lg"
        >
          <>
            <ArrowLeft className="h-4 w-4" />
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

                <Card className="border-border/70 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Before submit</CardTitle>
                    <CardDescription>Quick checks for safer publishing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {safetyChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2 text-sm">
                        {check.ok ? (
                          <CircleCheck className="h-4 w-4 text-success" />
                        ) : (
                          <TriangleAlert className="h-4 w-4 text-destructive" />
                        )}
                        <span className={check.ok ? "text-foreground" : "text-destructive"}>{check.label}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1 text-sm">
                      <span className="text-muted-foreground">Tone signal</span>
                      <span className={cn("text-xs font-semibold uppercase", toneStyle)}>{toneLevel}</span>
                    </div>
                  </CardContent>
                </Card>

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
                  <Button type="submit" size="lg" className="h-10 w-full px-5 sm:w-auto" disabled={!canSubmit}>
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
