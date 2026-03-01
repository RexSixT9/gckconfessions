"use client";

import {
  ShieldCheck,
  Lock,
  Eye,
  BookOpen,
  AlertTriangle,
  Heart,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { useRef, useMemo } from "react";
import Link from "next/link";
import { useStaggerEntrance } from "@/lib/gsapClient";
import TiltCard from "@/components/TiltCard";

export default function GuidelinesClient() {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useStaggerEntrance(contentRef, {
    from: { opacity: 0, y: 32 },
    duration: 0.6,
    stagger: 0.08,
  });

  /* --------------------------- MEMOIZED CONTENT --------------------------- */

  const privacyPoints = useMemo(
    () => [
      {
        icon: Eye,
        title: "We don't collect your identity",
        body:
          "No name, no email, no account required. Confessions are submitted with no personally identifying information. We cannot and do not link submissions back to individuals.",
      },
      {
        icon: ShieldCheck,
        title: "What we store",
        body:
          "We store the confession text, optional song tag, a one-way hash (for duplicate detection), and a submission timestamp. No IP address is stored alongside your confession.",
      },
      {
        icon: MessageSquare,
        title: "Moderation use only",
        body:
          "Submission data is accessed only by moderators for reviewing and publishing. It is never sold, shared, or used for advertising.",
      },
      {
        icon: Lock,
        title: "Abuse prevention",
        body:
          "IP addresses and User-Agent strings are processed temporarily for rate-limiting and bot protection. This data is never persisted.",
      },
      {
        icon: ShieldCheck,
        title: "Cookies",
        body:
          "The public site uses no tracking cookies. Admin sessions use a secure, HttpOnly authentication cookie that expires automatically.",
      },
    ],
    []
  );

  const guidelines = useMemo(
    () => [
      {
        label: "Allowed",
        variant: "accept" as const,
        items: [
          "Personal feelings, thoughts, or experiences you haven't shared before.",
          "Honest reflections — positive or negative — about your life.",
          "Lighthearted confessions or funny secrets.",
          "Supportive or empathetic community messages.",
        ],
      },
      {
        label: "Not allowed",
        variant: "reject" as const,
        items: [
          "Hate speech, slurs, or targeted harassment.",
          "Threats, doxxing, or exposing personal details.",
          "Sexual, violent, or graphic content.",
          "Spam, advertisements, or duplicate submissions.",
          "Illegal content.",
        ],
      },
    ],
    []
  );

  /* ----------------------------------------------------------------------- */

  return (
    <main
      ref={contentRef}
      className="mx-auto w-full max-w-3xl px-4 sm:px-6"
    >
      {/* ================= Back Button ================= */}
      <div className="pt-8">
        <Link
          href="/"
          aria-label="Back to home"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* ================= Header ================= */}
      <header className="pb-8 pt-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--accent))]">
          <BookOpen className="h-4 w-4" />
          Privacy & Guidelines
        </span>

        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          How this space works.
        </h1>

        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          GCK Confessions is built on anonymity, care, and trust. Please review
          our privacy practices and community standards before posting.
        </p>
      </header>

      {/* ================= Privacy Section ================= */}
      <section className="mb-10 rounded-2xl border bg-card">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/15">
            <Lock className="h-4 w-4 text-[hsl(var(--accent))]" />
          </div>
          <h2 className="text-base font-bold">Privacy Policy</h2>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {privacyPoints.map(({ icon: Icon, title, body }) => (
            <TiltCard
              key={title}
              className="rounded-xl border bg-muted/30 p-4 transition hover:shadow-sm"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {body}
              </p>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ================= Community Guidelines ================= */}
      <section className="mb-10 rounded-2xl border bg-card">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/15">
            <Heart className="h-4 w-4 text-[hsl(var(--accent))]" />
          </div>
          <h2 className="text-base font-bold">Community Guidelines</h2>
        </div>

        <div className="divide-y">
          {guidelines.map(({ label, variant, items }) => {
            const isAccept = variant === "accept";

            return (
              <div key={label} className="px-5 py-5">
                <div
                  className={`mb-3 inline-flex items-center gap-2 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    isAccept
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border border-red-500/30 bg-red-500/10 text-red-600"
                  }`}
                >
                  {isAccept ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {label}
                </div>

                <ul className="space-y-2 text-xs text-muted-foreground">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                          isAccept ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= Enforcement ================= */}
      <section className="mb-12 rounded-2xl border bg-muted/40 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold">Enforcement</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              All submissions are reviewed before publication. Violating posts
              are rejected without notification. Repeated abuse may result in
              rate-limiting or temporary submission blocks. Moderators have
              final discretion.
            </p>
          </div>
        </div>
      </section>

      <p className="mb-14 text-center text-xs text-muted-foreground">
        Last reviewed February 2026.
      </p>
    </main>
  );
}