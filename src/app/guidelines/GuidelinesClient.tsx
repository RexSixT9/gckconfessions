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
          className="btn-ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      {/* ================= Header ================= */}
      <header className="pb-10 pt-8">
        <span className="badge badge-accent">
          <BookOpen className="h-3.5 w-3.5" />
          Privacy & Guidelines
        </span>

        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
          How this space works.
        </h1>

        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          GCK Confessions is built on anonymity, care, and trust. Please review
          our privacy practices and community standards before posting.
        </p>
      </header>

      {/* ================= Privacy Section ================= */}
      <section className="card mb-12">
        <div className="flex items-center gap-4 border-b px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/15">
            <Lock className="h-5 w-5 text-[hsl(var(--accent))]" />
          </div>
          <h2 className="text-lg font-black">Privacy Policy</h2>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          {privacyPoints.map(({ icon: Icon, title, body }) => (
            <TiltCard
              key={title}
              className="card-glass p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ================= Community Guidelines ================= */}
      <section className="card mb-12">
        <div className="flex items-center gap-4 border-b px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/15">
            <Heart className="h-5 w-5 text-[hsl(var(--accent))]" />
          </div>
          <h2 className="text-lg font-black">Community Guidelines</h2>
        </div>

        <div className="divide-y">
          {guidelines.map(({ label, variant, items }) => {
            const isAccept = variant === "accept";

            return (
              <div key={label} className="px-6 py-6">
                <div
                  className={`mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                    isAccept
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border border-red-500/30 bg-red-500/10 text-red-600"
                  }`}
                >
                  {isAccept ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {label}
                </div>

                <ul className="space-y-3 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        className={`mt-2 h-1.5 w-1.5 rounded-full ${
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
      <section className="card-glass mb-16 p-6">
        <div className="flex gap-4">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
          <div>
            <h3 className="text-base font-bold">Enforcement</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
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