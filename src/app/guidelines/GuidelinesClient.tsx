"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Eye,
  Heart,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
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
import { Separator } from "@/components/ui/separator";
import { PageReveal, ScrollReveal } from "@/components/Reveal";

const privacyPoints = [
  {
    icon: Eye,
    title: "No identity collection",
    body: "No account, no name, and no email are required to submit a confession.",
  },
  {
    icon: Lock,
    title: "Minimal storage",
    body: "We store confession text, optional song tag, and moderation metadata only.",
  },
  {
    icon: MessageSquare,
    title: "Moderation-only access",
    body: "Only moderators can access queue content for review and approval.",
  },
  {
    icon: ShieldCheck,
    title: "Abuse protection",
    body: "Rate-limit and bot checks run transiently and are not tied to public posts.",
  },
];

const allowed = [
  "Personal reflections, emotions, and life experiences.",
  "Supportive and empathetic messages.",
  "Lighthearted, respectful confessions.",
];

const disallowed = [
  "Hate speech, slurs, and harassment.",
  "Doxxing, threats, and exposure of private details.",
  "Violent, sexual, illegal, or spam content.",
];

const moderationFlow = [
  {
    title: "Write anonymously",
    body: "No login wall, no profile, and no public author identity attached to a submission.",
  },
  {
    title: "Safety review",
    body: "Automated filters and a human moderator review submissions before anything is published.",
  },
  {
    title: "Publish selectively",
    body: "Only confessions that fit the community rules make it onto the public feed.",
  },
];

const privacyNotes = [
  "Local draft saving stays on your device when enabled.",
  "We keep moderation metadata private and separate from public posts.",
  "Submission protections exist to reduce spam and abuse, not to identify authors.",
];

export default function GuidelinesClient() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageReveal>
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

      <ScrollReveal>
        <Card className="relative overflow-hidden border-accent/20 bg-linear-to-br from-background via-background to-accent/10 shadow-[0_24px_90px_-45px_hsl(var(--accent)/0.45)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/70 to-transparent" />
          <div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-accent/12 blur-3xl" />
          <CardHeader className="relative gap-6 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
              <Badge className="w-fit gap-1 bg-accent/10 text-accent hover:bg-accent/10">
                <BookOpen className="h-3.5 w-3.5" />
                Privacy and Guidelines
              </Badge>
              <div className="space-y-3">
                <CardTitle className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                  Anonymous by design, moderated with clear limits.
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  This space is built for honest expression, but not at the cost of safety. These rules explain what we store, what we reject, and how moderation works.
                </CardDescription>
              </div>
            </div>

            <div className="grid gap-3 sm:min-w-72">
              {[
                { label: "No accounts required", icon: Lock },
                { label: "Human-reviewed submissions", icon: ShieldCheck },
                { label: "Clear content boundaries", icon: AlertTriangle },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/85 px-4 py-3 backdrop-blur">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/12 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>
      </ScrollReveal>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {privacyPoints.map(({ icon: Icon, title, body }, index) => (
          <ScrollReveal key={title} delay={index * 0.06}>
            <Card className="h-full border-border/70 bg-card/90 shadow-none">
              <CardHeader className="gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <CardTitle className="text-base font-bold">{title}</CardTitle>
                <CardDescription className="leading-6">{body}</CardDescription>
              </CardHeader>
            </Card>
          </ScrollReveal>
        ))}

        <ScrollReveal delay={0.18}>
          <Card className="border-accent/20 bg-linear-to-br from-accent/8 via-background to-background shadow-none">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-accent/25 text-accent">
                Privacy Notes
              </Badge>
              <CardTitle className="text-xl font-black tracking-tight">What privacy means here</CardTitle>
              <CardDescription className="leading-6">
                Anonymous posting is only credible if the platform limits what it collects and keeps the review process narrow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {privacyNotes.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </ScrollReveal>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <ScrollReveal>
          <Card className="border-success/40 bg-linear-to-br from-success/6 via-background to-background shadow-none">
          <CardHeader>
            <Badge variant="outline" className="w-fit border-success/50 text-success">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Allowed
            </Badge>
            <CardTitle className="text-base font-bold">Content we welcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {allowed.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.06}>
          <Card className="border-destructive/40 bg-linear-to-br from-destructive/6 via-background to-background shadow-none">
          <CardHeader>
            <Badge variant="outline" className="w-fit border-destructive/50 text-destructive">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              Not Allowed
            </Badge>
            <CardTitle className="text-base font-bold">Content we reject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {disallowed.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>
        </ScrollReveal>
      </section>

      <ScrollReveal delay={0.08}>
        <Card className="mt-8 border-border/70 shadow-none">
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-base font-bold">How moderation works</CardTitle>
              <CardDescription>
                Every confession is screened in the same order so moderation stays predictable and fair.
              </CardDescription>
            </div>
            <Button size="sm" render={<Link href="/submit" />} className="w-full sm:w-auto">
              <>
                <Send className="h-4 w-4" />
                Write a confession
              </>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {moderationFlow.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border/70 bg-background/85 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/12 text-xs font-semibold text-accent">
                    0{index + 1}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Card className="mt-6 border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-bold">Enforcement</CardTitle>
            <CardDescription>
              Repeated abusive submissions may trigger temporary submission blocks. Moderator decisions are final.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-accent" />
              Last reviewed February 2026
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
      </PageReveal>
    </main>
  );
}
