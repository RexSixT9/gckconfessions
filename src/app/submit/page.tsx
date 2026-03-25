"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
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
import { PageBackLink, PageIntro, PageShell } from "@/components/PageScaffold";
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
      toast.info("Saved for later", {
        description: "You are offline, so we will send this automatically when your connection is back.",
      });
    } catch {
      toast.error("Could not save offline", {
        description: "We could not keep this submission in your offline queue.",
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
        toast.success("Back online", {
          description: "Your queued confession was sent successfully.",
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
      colors: ["#06b6d4", "#22d3ee", "#67e8f9", "#e2f8ff"],
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
          headers: { "Content-Type": "application/json", "x-human-check": "1" },
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

        toast.success("You are all set", {
          description: "Thanks for sharing. A moderator will review this before it is posted.",
        });

        void fireConfetti();
      } catch (error) {
        const messageText =
          error instanceof Error && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : error instanceof Error
              ? error.message
              : "Unknown error. Please try again.";

        toast.error("Could not submit", { description: messageText });
      } finally {
        setLoading(false);
      }
    },
    [message, music, website, loading, fireConfetti, queueOfflineSubmission]
  );

  const charCount = useMemo(() => message.length, [message]);

  const guidanceText = useMemo(() => {
    if (charCount < 30) return "Add a little more context so reviewers can understand it clearly.";
    if (charCount > CHAR_LIMIT * 0.9) return "You are close to the limit, so keep only what matters most.";
    return "This reads well. Keep it clear and avoid personal details.";
  }, [charCount]);

  const canSubmit = Boolean(message.trim()) && !loading;

  return (
    <PageShell containerClassName="max-w-4xl">
      <PageReveal>
        <PageBackLink />
        <PageIntro
          badge="Submit"
          title="Transmit Your Confession"
          description="Write clearly, stay anonymous, and submit to the review queue."
        />

        <Card className="border-border/70 bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-[clamp(1.3rem,3.8vw,2rem)] font-semibold tracking-[0.04em]">Compose message</CardTitle>
            <CardDescription>
              Keep it honest, remove personal identifiers, then send.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-7 max-[430px]:space-y-5 max-[359px]:space-y-4">
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
                      Message
                    </Label>
                    <span
                      id="confession-count"
                      className={cn(
                        "text-[0.68rem] tabular-nums uppercase tracking-widest text-muted-foreground max-[430px]:text-[0.62rem] max-[359px]:text-[0.56rem]",
                        charCount > CHAR_LIMIT * 0.9 && "font-medium text-destructive"
                      )}
                      role="status"
                      aria-live="polite"
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
                    className="min-h-56 resize-none rounded-md border-border bg-background text-sm leading-6 shadow-none max-[430px]:min-h-48 max-[430px]:text-[0.92rem] max-[359px]:min-h-44 max-[359px]:text-[0.84rem]"
                    placeholder="Type your confession..."
                    required
                    aria-describedby="confession-help confession-count"
                  />
                  <p id="confession-help" className="text-[0.75rem] text-muted-foreground max-[359px]:text-[0.68rem]" aria-live="polite">
                    {guidanceText}
                  </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="music" className="text-sm font-medium">
                      Optional soundtrack
                    </Label>
                    <Input
                      id="music"
                      name="music"
                      value={music}
                      onChange={(event) => setMusic(event.target.value)}
                      maxLength={120}
                      placeholder="Artist - Track"
                      className="h-11 rounded-md border-border bg-background shadow-none max-[430px]:h-10.5 max-[359px]:h-10"
                    />
                    <p className="text-[0.75rem] text-muted-foreground max-[359px]:text-[0.68rem]">Artist - Track (optional)</p>
                </div>

                <div className="rounded-md border border-border p-4 max-[430px]:p-3.5 max-[359px]:p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] max-[359px]:text-[0.64rem]">Draft Buffer</p>
                      <p className="text-[0.75rem] text-muted-foreground max-[359px]:text-[0.68rem]">
                        {draftError
                          ? "Local storage is not available on this device."
                          : hasDraft && saveDraft
                            ? "Draft saved on this device."
                            : "Auto-save is available while you write."}
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
                      <Button
                        type="button"
                        variant={saveDraft ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSaveDraft((prev) => !prev)}
                        disabled={draftError}
                        className="w-full sm:w-auto"
                      >
                        {saveDraft ? "Auto-save enabled" : "Auto-save disabled"}
                      </Button>
                      {hasDraft && (
                        <Button type="button" variant="ghost" size="sm" onClick={clearDraft} className="w-full sm:w-auto">
                          Remove draft
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" variant="brand" size="touch" className="w-full gap-2 sm:w-auto max-[359px]:h-10 max-[359px]:text-[0.67rem]" disabled={!canSubmit}>
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
    </PageShell>
  );
}
