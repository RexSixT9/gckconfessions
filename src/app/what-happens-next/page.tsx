import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "What Happens Next",
  description: "Simple moderation flow after submitting a confession.",
};

const steps = [
  {
    title: "Submission received",
    body: "Your confession is stored and queued for moderation.",
  },
  {
    title: "Safety checks",
    body: "Automated checks scan for spam and personal identifiers.",
  },
  {
    title: "Human review",
    body: "A moderator reviews the content for quality and policy compliance.",
  },
  {
    title: "Publish or reject",
    body: "Approved confessions are published. Rejected confessions stay private.",
  },
];

export default function WhatHappensNextPage() {
  return (
    <main className="mx-auto flex-1 w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Button variant="ghost" size="sm" render={<Link href="/submit" />} className="mb-6 gap-1.5">
        <>
          <ArrowLeft className="h-4 w-4" />
          Back to submit
        </>
      </Button>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <Badge className="w-fit">Moderation Flow</Badge>
          <CardTitle className="text-2xl font-semibold tracking-tight">What happens after you submit</CardTitle>
          <CardDescription>
            Every confession follows the same review process before public posting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-border/70 p-4">
              <p className="text-xs font-semibold text-muted-foreground">STEP {index + 1}</p>
              <p className="mt-1 text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}

          <div className="flex items-center gap-2 rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            We do not attach your identity to published confessions.
          </div>

          <div className="flex gap-2">
            <Button render={<Link href="/submit" />}>Write a confession</Button>
            <Button variant="outline" render={<Link href="/guidelines" />}>
              Read guidelines
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
