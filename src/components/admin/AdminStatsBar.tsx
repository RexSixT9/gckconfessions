"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

type AdminStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type StatItem = {
  label: string;
  value: number;
  valueClassName: string;
  dotClassName: string;
  animationDelayClassName: string;
};

const POLL_MS = 12000;

export default function AdminStatsBar({ initialStats }: { initialStats: AdminStats | null }) {
  const [stats, setStats] = useState<AdminStats | null>(initialStats);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const etagRef = useRef("");

  const fetchStats = useCallback(async () => {
    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const headers: HeadersInit = {};
    if (etagRef.current) {
      headers["If-None-Match"] = etagRef.current;
    }

    try {
      const response = await fetch("/api/admin/stats", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers,
        signal: controller.signal,
      });

      if (response.status === 304) return;

      if (!response.ok) return;
      if (requestId !== requestSeqRef.current) return;

      const nextEtag = response.headers.get("etag");
      if (nextEtag) {
        etagRef.current = nextEtag;
      }

      const data = (await response.json()) as AdminStats;
      setStats({
        total: Number(data.total ?? 0),
        pending: Number(data.pending ?? 0),
        approved: Number(data.approved ?? 0),
        rejected: Number(data.rejected ?? 0),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      // Silent retry on next interval.
    }
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void fetchStats();
    };

    const onDataUpdated = () => {
      void fetchStats();
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void fetchStats();
    }, POLL_MS);

    window.addEventListener("focus", onFocus);
    window.addEventListener("admin-data-updated", onDataUpdated as EventListener);

    return () => {
      abortRef.current?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("admin-data-updated", onDataUpdated as EventListener);
    };
  }, [fetchStats]);

  if (!stats) return null;

  const statItems: StatItem[] = [
    {
      label: "Total",
      value: stats.total,
      valueClassName: "text-foreground",
      dotClassName: "bg-muted-foreground",
      animationDelayClassName: "",
    },
    {
      label: "In review",
      value: stats.pending,
      valueClassName: "text-warning",
      dotClassName: "bg-warning",
      animationDelayClassName: "animation-delay-100",
    },
    {
      label: "Approved",
      value: stats.approved,
      valueClassName: "text-green-600 dark:text-green-400",
      dotClassName: "bg-green-500",
      animationDelayClassName: "animation-delay-200",
    },
    {
      label: "Declined",
      value: stats.rejected,
      valueClassName: "text-muted-foreground",
      dotClassName: "bg-muted-foreground/40",
      animationDelayClassName: "animation-delay-300",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {statItems.map(({ label, value, valueClassName, dotClassName, animationDelayClassName }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: label === "Total" ? 0 : 0.04 }}
        >
          <Card className={`animate-slide-up border-border/70 ${animationDelayClassName}`}>
            <CardContent className="flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              </div>
              <span className={`text-3xl font-black tabular-nums ${valueClassName}`}>{value}</span>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
