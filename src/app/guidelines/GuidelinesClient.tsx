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

export default function GuidelinesClient() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
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
        <Card className="border-border/70">
          <CardHeader>
            <Badge className="w-fit gap-1 bg-accent/10 text-accent hover:bg-accent/10">
              <BookOpen className="h-3.5 w-3.5" />
              Privacy and Guidelines
            </Badge>
            <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
              How this community stays safe
            </CardTitle>
            <CardDescription>
              GCK Confessions is designed for anonymous expression with clear moderation rules.
            </CardDescription>
          </CardHeader>
        </Card>
      </ScrollReveal>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {privacyPoints.map(({ icon: Icon, title, body }, index) => (
          <ScrollReveal key={title} delay={index * 0.06}>
            <Card className="h-full border-border/70">
              <CardHeader>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <CardTitle className="text-base font-bold">{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
            </Card>
          </ScrollReveal>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <ScrollReveal>
          <Card className="border-success/40">
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
          <Card className="border-destructive/40">
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
        <Card className="mt-8 border-border/70">
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
