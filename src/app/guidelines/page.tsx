"use client";
import Link from "next/link";
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
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";
import { useStaggerEntrance as useScrollReveal } from "@/lib/gsapClient";

export const metadata = {
  title: "Privacy & Guidelines — GCK Confessions",
  description:
    "How we handle your privacy and the community guidelines for GCK Confessions.",
};

export default function GuidelinesPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  useScrollReveal(contentRef, { from: { opacity: 0, y: 34 }, duration: 0.55, stagger: 0.08 });

  function useBentoCardMotion() {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useSpring(1, { stiffness: 300, damping: 30 });
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      x.set((px - 0.5) * 16);
      y.set((py - 0.5) * 16);
      scale.set(1.035);
    };
    const handlePointerLeave = () => {
      x.set(0);
      y.set(0);
      scale.set(1);
    };
    return { x, y, scale, handlePointerMove, handlePointerLeave };
  }

  return (
    <main className="flex-1">
      <div ref={contentRef} className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        {/* Back */}
        <div className="pt-8 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>

        {/* Page header */}
        <section className="pb-6 pt-5 sm:pb-8 sm:pt-6">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/8 px-3 py-1 text-xs font-semibold text-[hsl(var(--accent))]">
            <BookOpen className="h-3.5 w-3.5" />
            Privacy &amp; Guidelines
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
            How this space works.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
            GCK Confessions is built on anonymity, care, and community trust. Read through our
            privacy practices and community standards before posting.
          </p>
        </section>

        {/* ── PRIVACY SECTION ─────────────────────────────── */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          {/* Section header */}
          <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-4 py-3 sm:px-6 sm:py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
              <Lock className="h-4 w-4 text-[hsl(var(--accent))]" />
            </span>
            <h2 className="text-sm font-bold text-[hsl(var(--foreground))] sm:text-base">Privacy Policy</h2>
          </div>

          {/* Bento grid for privacy points */}
          <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2">
            {[
              {
                icon: Eye,
                title: "We don't collect your identity",
                body: "No name, no email, no account required. Confessions are submitted with no personally identifying information. We cannot and do not link submissions back to individuals.",
              },
              {
                icon: ShieldCheck,
                title: "What we do store",
                body: "We store the text of your confession, an optional song tag, a one-way hash of the message (to detect duplicates), and a submission timestamp. No IP address is stored alongside your confession.",
              },
              {
                icon: MessageSquare,
                title: "Moderation use only",
                body: "Submission data is only accessed by moderators for the purpose of reviewing and publishing confessions. It is never sold, shared with third parties, or used for advertising.",
              },
              {
                icon: Lock,
                title: "Rate-limiting and abuse prevention",
                body: "We temporarily process IP addresses and User-Agent strings to enforce rate limits and block bots. This data is held in memory only and is not persisted to any database.",
              },
              {
                icon: ShieldCheck,
                title: "Cookies",
                body: "The public-facing site uses no tracking cookies. Admin sessions use a secure, HttpOnly cookie for authentication that expires automatically.",
              },
            ].map(({ icon: Icon, title, body }) => {
              const motionProps = useBentoCardMotion();
              return (
                <motion.div
                  key={title}
                  className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/60 px-4 py-5 backdrop-blur-sm transition-all duration-200 focus:outline-none"
                  style={{
                    rotateX: motionProps.y,
                    rotateY: motionProps.x,
                    scale: motionProps.scale,
                    willChange: "transform"
                  }}
                  onPointerMove={motionProps.handlePointerMove}
                  onPointerLeave={motionProps.handlePointerLeave}
                  onPointerDown={motionProps.handlePointerMove}
                  onPointerUp={motionProps.handlePointerLeave}
                  tabIndex={0}
                  aria-label={title}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
                    <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  </span>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{body}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── COMMUNITY GUIDELINES ────────────────────────── */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-4 py-3 sm:px-6 sm:py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
              <Heart className="h-4 w-4 text-[hsl(var(--accent))]" />
            </span>
            <h2 className="text-sm font-bold text-[hsl(var(--foreground))] sm:text-base">Community Guidelines</h2>
          </div>

          <div className="divide-y divide-[hsl(var(--border))]">
            {[
              {
                label: "Allowed",
                variant: "accept" as const,
                items: [
                  "Personal feelings, thoughts, or experiences you haven't shared before.",
                  "Honest reflections — positive or negative — about your life.",
                  "Lighthearted confessions, guilty pleasures, or funny secrets.",
                  "Supportive or empathetic messages directed at the community.",
                ],
              },
              {
                label: "Not allowed",
                variant: "reject" as const,
                items: [
                  "Hate speech, slurs, or content targeting individuals or groups.",
                  "Threats, harassment, or doxxing of any kind.",
                  "Personal information about others (names, numbers, locations).",
                  "Sexual, violent, or graphic content.",
                  "Spam, advertisements, or repeated identical submissions.",
                  "Content that violates applicable laws.",
                ],
              },
            ].map(({ label, variant, items }) => (
              <div key={label} className="px-4 py-4 sm:px-6 sm:py-5">
                <p
                  className={`mb-3 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    variant === "accept"
                      ? "border border-[hsl(var(--action-accept))]/30 bg-[hsl(var(--action-accept))]/10 text-[hsl(var(--action-accept))]"
                      : "border border-[hsl(var(--action-reject))]/30 bg-[hsl(var(--action-reject))]/10 text-[hsl(var(--action-reject))]"
                  }`}
                >
                  {variant === "accept" ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {label}
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          variant === "accept"
                            ? "bg-[hsl(var(--action-accept))]"
                            : "bg-[hsl(var(--action-reject))]"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── ENFORCEMENT ─────────────────────────────────── */}
        <section className="mb-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Enforcement</p>
              <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                All submissions are reviewed before publication. Posts that violate these guidelines
                are rejected without notification. Repeated abuse may result in rate-limiting or
                temporary blocking of submission access. Moderators have final discretion on all
                publishing decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <p className="mb-12 text-center text-[11px] text-[hsl(var(--muted-foreground))]">
          These guidelines may be updated at any time. Last reviewed February 2026.
        </p>
      </div>
    </main>
  );
}
