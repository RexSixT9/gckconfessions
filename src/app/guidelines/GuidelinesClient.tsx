"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  Shield,
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
import { PageReveal } from "@/components/Reveal";

const privacyPoints = [
  "No login is required to submit a confession.",
  "We store confession text, optional music tag, and moderation metadata.",
  "Only moderators can access the review queue.",
  "Abuse protections run to keep the platform safe.",
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

const privacyNotes = [
  "Local drafts stay on your device when auto-save is enabled.",
  "Public posts do not include your identity.",
  "Repeated abuse may trigger temporary submission blocks.",
];

export default function GuidelinesClient() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PageReveal>
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/" />}
        className="group mb-8 gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2 backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-accent/5"
      >
        <>
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </>
      </Button>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="space-y-3 pb-6">
          <Badge className="w-fit bg-accent/10 text-accent hover:bg-accent/10">Privacy and Guidelines</Badge>
          <CardTitle className="text-3xl font-bold tracking-tight text-balance">Simple safety rules</CardTitle>
          <CardDescription className="text-base">
            This platform is anonymous, moderated, and designed to reduce abuse.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-lg font-bold">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {privacyPoints.map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <p>{point}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-lg font-bold">Extra notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {privacyNotes.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <Badge variant="outline" className="w-fit gap-1.5 border-action-accept/30 bg-action-accept/5 text-action-accept">
              <ShieldCheck className="h-3.5 w-3.5" />
              Allowed
            </Badge>
            <CardTitle className="text-lg font-bold">Content we welcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            {allowed.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-action-accept" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <Badge variant="outline" className="w-fit gap-1.5 border-destructive/30 bg-destructive/5 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Not Allowed
            </Badge>
            <CardTitle className="text-lg font-bold">Content we reject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            {disallowed.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>
      </section>

      </PageReveal>
    </main>
  );
}
