"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Heart, Lock, Music2, Send, ShieldCheck } from "lucide-react";

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
    [message, music, website, loading, fireConfetti]
  );

  const charCount = useMemo(() => message.length, [message]);

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Button variant="ghost" size="sm" render={<Link href="/" />} className="mb-4 -ml-2 rounded-full px-3 py-2">
          <>
            <ArrowLeft className="h-4 w-4" />
            Home
          </>
        </Button>

        <Card className="border-border/70">
          <CardHeader className="gap-3">
            <Badge className="w-fit bg-accent/10 text-accent hover:bg-accent/10">
              Anonymous Submission
            </Badge>
            <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
              Share your confession
            </CardTitle>
            <CardDescription>
              We never ask for your identity. Your confession is reviewed by a person before it goes live.
            </CardDescription>
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
                  rows={8}
                  placeholder="What has been on your mind?"
                />
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
                className="h-auto w-full rounded-full px-8 py-4 text-sm font-semibold"
                size="lg"
                disabled={loading || !message.trim()}
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
      </div>
    </main>
  );
}
