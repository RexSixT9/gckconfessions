"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  CircleCheck,
  Eye,
  EyeOff,
  Lock,
  Music2,
  Send,
  ShieldCheck,
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
import { Toggle } from "@/components/ui/toggle";
import { PageReveal, ScrollReveal } from "@/components/Reveal";
import { cn } from "@/lib/cn";

const CHAR_LIMIT = 1000;
const DRAFT_KEY = "gckconfessions:draft";
const FIRST_VISIT_KEY = "gckconfessions:submit:first-visit";
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
  const confessionRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [music, setMusic] = useState("");
  const [website, setWebsite] = useState("");
  const [saveDraft, setSaveDraft] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

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
    try {
      if (!localStorage.getItem(FIRST_VISIT_KEY)) {
        setFirstVisit(true);
      }
    } catch {
      setFirstVisit(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      void syncOfflineQueue();
    };

    window.addEventListener("online", handleOnline);
    void syncOfflineQueue();

    return () => window.removeEventListener("online", handleOnline);
  }, [syncOfflineQueue]);

  useEffect(() => {
    if (!focusMode) return;
    confessionRef.current?.focus({ preventScroll: true });
  }, [focusMode]);

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
    if (charCount < 30) return "Add a bit more context so moderators understand your story.";
    if (charCount > CHAR_LIMIT * 0.9) return "You are close to the character limit. Keep only essentials.";
    return "Balanced length. Clear confessions are reviewed faster.";
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
      <PageReveal className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <ScrollReveal>
            <Card className={cn("border-border/70 shadow-none", focusMode && "border-accent/25")}>
            <CardHeader className="gap-4 border-b border-border/70 pb-5">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Share your confession
                </CardTitle>
                <CardDescription className="max-w-2xl">
                  A quiet, anonymous form. Write clearly, avoid personal details, and a moderator will review it before anything is published.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Anonymous by default
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Human reviewed
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
                  <Music2 className="h-3.5 w-3.5" />
                  Music tag optional
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
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

                <div className="space-y-2.5">
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
                    ref={confessionRef}
                    id="confession"
                    name="confession"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={CHAR_LIMIT}
                    rows={focusMode ? 14 : 10}
                    className={cn(
                      "min-h-56 resize-none border-border/70 bg-background text-sm leading-6 shadow-none",
                      focusMode && "border-accent/30"
                    )}
                    placeholder="What has been on your mind?"
                  />
                  <p className="text-xs text-muted-foreground">{guidanceText}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2.5">
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
                    <p className="text-xs text-muted-foreground">Optional. Keep it short and recognizable.</p>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium">Writing view</Label>
                    <Toggle
                      pressed={focusMode}
                      onPressedChange={setFocusMode}
                      variant="outline"
                      size="lg"
                      className="h-10 w-full justify-start gap-2 border-border/70 px-3 text-sm font-medium hover:bg-background"
                    >
                      {focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {focusMode ? "Focused editor enabled" : "Focused editor disabled"}
                    </Toggle>
                    <p className="text-xs text-muted-foreground">A calmer layout with fewer visual distractions.</p>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Draft and submit</p>
                      <p className="text-xs text-muted-foreground">
                        {draftError
                          ? "Local storage is unavailable on this device."
                          : hasDraft && saveDraft
                            ? "Your draft is stored locally on this device."
                            : "Auto-save is available while you write."}
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

                  <Separator />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Ready for review</p>
                      <p className="text-xs text-muted-foreground">
                        Only clear, non-identifying confessions move through moderation quickly.
                      </p>
                    </div>
                    <Button type="submit" size="lg" className="h-10 px-5" disabled={!canSubmit}>
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
                </div>
              </form>
            </CardContent>
            </Card>
          </ScrollReveal>

          <div className="space-y-4">
            {firstVisit && (
              <ScrollReveal delay={0.05}>
                <Card className="border-border/70 shadow-none">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Before you submit</CardTitle>
                  <CardDescription>
                    We do not ask for your name or account. Drafts stay on your device.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-success" />
                    <span>Every post is reviewed by a human moderator.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-success" />
                    <span>Avoid names, phone numbers, links, and personal email addresses.</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.setItem(FIRST_VISIT_KEY, "seen");
                      setFirstVisit(false);
                    }}
                  >
                    Dismiss
                  </Button>
                </CardContent>
                </Card>
              </ScrollReveal>
            )}

            <ScrollReveal delay={0.1}>
              <Card className="border-border/70 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">Checks</CardTitle>
                <CardDescription>These simple checks help keep the queue safe and readable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tone risk</span>
                  <span className={cn("text-xs font-semibold uppercase", toneStyle)}>{toneLevel}</span>
                </div>
                <Separator />
                <div className="space-y-2">
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
                </div>
              </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </PageReveal>
    </main>
  );
}
