"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  CircleCheck,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Music2,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
        if (!message.trim() && !music.trim()) return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ message, music }));
        setHasDraft(true);
      } catch {
        setDraftError(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [message, music, saveDraft]);

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
  const canSubmit = Boolean(message.trim()) && checksPassed && !loading;

  const toneStyle =
    toneLevel === "high"
      ? "text-destructive"
      : toneLevel === "medium"
        ? "text-warning"
        : "text-success";

  return (
    <main className="flex-1 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-12"
      >
        <Button variant="ghost" size="sm" render={<Link href="/" />} className="mb-6 -ml-2 gap-1.5 rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">
          <>
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </>
        </Button>

        {firstVisit && (
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardHeader className="gap-2 pb-3">
              <Badge className="w-fit gap-1.5 bg-accent/10 text-accent hover:bg-accent/10">
                <Sparkles className="h-3 w-3" />
                First-time walkthrough
              </Badge>
              <CardTitle className="text-base font-bold">How anonymity works</CardTitle>
              <CardDescription>
                We do not ask for your name or account. Avoid adding personal identifiers in the text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-success" />
                <span>Drafts are saved only on your device.</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-success" />
                <span>Human moderators review every post before publish.</span>
              </div>
              <Button
                type="button"
                size="sm"
                className="touch-target rounded-full px-4"
                onClick={() => {
                  localStorage.setItem(FIRST_VISIT_KEY, "seen");
                  setFirstVisit(false);
                }}
              >
                Continue writing
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className={cn("border-border/60 shadow-sm", focusMode && "border-accent/40 shadow-lg shadow-accent/10")}>
          <CardHeader className="gap-3">
            <Badge className="w-fit gap-1.5 bg-accent/10 text-accent hover:bg-accent/10">
              <Heart className="h-3 w-3" />
              Anonymous Submission
            </Badge>
            <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
              Share your confession
            </CardTitle>
            <CardDescription>
              We never ask for your identity. Your confession is reviewed by a person before it goes live.
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-target rounded-full px-4"
                onClick={() => setFocusMode((prev) => !prev)}
              >
                {focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {focusMode ? "Exit focus mode" : "Focus writing mode"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
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
                  <Label htmlFor="confession" className="text-sm font-semibold">
                    Your confession
                  </Label>
                  <span
                    className={cn(
                      "text-xs tabular-nums text-muted-foreground",
                      charCount > CHAR_LIMIT * 0.9 && "font-semibold text-destructive"
                    )}
                  >
                    {charCount} / {CHAR_LIMIT}
                  </span>
                </div>
                <Textarea
                  id="confession"
                  name="confession"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={CHAR_LIMIT}
                  rows={focusMode ? 13 : 8}
                  className={cn("text-[15px] leading-6", focusMode && "border-accent/40 bg-background")}
                  placeholder="What has been on your mind?"
                />
                <p className="text-xs text-muted-foreground">{guidanceText}</p>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <p className="mb-2 text-sm font-semibold">Confidence indicators</p>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tone risk:</span>
                  <span className={cn("text-xs font-semibold uppercase", toneStyle)}>{toneLevel}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {safetyChecks.map((check) => (
                    <div
                      key={check.label}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                        check.ok
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      )}
                    >
                      {check.ok ? <CircleCheck className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
                      {check.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="music" className="text-sm font-semibold">
                  Song for this confession (optional)
                </Label>
                <Input
                  id="music"
                  name="music"
                  value={music}
                  onChange={(event) => setMusic(event.target.value)}
                  maxLength={120}
                  placeholder="Artist - Song"
                />
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Local draft</p>
                    <p className="text-xs text-muted-foreground">
                      {draftError
                        ? "Storage unavailable"
                        : hasDraft && saveDraft
                          ? "Draft saved"
                          : "Auto-save enabled"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={saveDraft ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSaveDraft((prev) => !prev)}
                      disabled={draftError}
                    >
                      {saveDraft ? "Saving" : "Paused"}
                    </Button>
                    {hasDraft && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearDraft}>
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="hidden h-auto w-full rounded-full px-8 py-4 text-sm font-semibold sm:inline-flex"
                size="lg"
                disabled={!canSubmit}
              >
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

              <div className="keyboard-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
                <Button
                  type="submit"
                  className="touch-target h-auto w-full rounded-full px-6 py-3.5 text-sm font-semibold"
                  size="lg"
                  disabled={!canSubmit}
                >
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

        <Card className="mt-6 border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-bold">Safety and review</CardTitle>
            <CardDescription>
              Every post is moderated before publication to keep the space respectful.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-accent" />
              <span>Anonymous by default</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span>Human moderation queue</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Music2 className="h-4 w-4 text-accent" />
              <span>Optional music tag</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-accent" />
              <span>No account required</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
