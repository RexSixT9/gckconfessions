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
        className="mb-6 shrink-0 gap-1.5 rounded-lg"
      >
        <>
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </>
      </Button>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <Badge className="w-fit">Privacy and Guidelines</Badge>
          <CardTitle className="text-2xl font-semibold tracking-tight">Simple safety rules</CardTitle>
          <CardDescription>
            This platform is anonymous, moderated, and designed to reduce abuse.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {privacyPoints.map((point) => (
              <p key={point}>• {point}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Extra notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {privacyNotes.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="border-border/70 shadow-none">
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Allowed
            </Badge>
            <CardTitle className="text-base">Content we welcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {allowed.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/50" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              Not Allowed
            </Badge>
            <CardTitle className="text-base">Content we reject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {disallowed.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/50" />
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
