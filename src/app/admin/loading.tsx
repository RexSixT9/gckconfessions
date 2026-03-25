"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="space-y-3">
            <Skeleton className="h-5 w-24 rounded-sm" />
            <Skeleton className="h-10 w-56 rounded-md" />
            <Skeleton className="h-4 w-[min(72vw,20rem)] rounded-lg" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-md border border-border/70 bg-card px-4 py-4 sm:px-6 sm:py-5"
            >
              <Skeleton className="mb-3 h-4 w-16 rounded-md" />
              <Skeleton className="h-9 w-14 rounded-lg" />
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-md border border-border/70 bg-card p-6 sm:p-8"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>

          <div className="mb-5 flex flex-wrap gap-2 pb-4">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border/70 bg-background/20">
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="ml-auto h-4 w-28 rounded-lg" />
                  </div>
                  <Skeleton className="h-16 rounded-xl" />
                  <div className="mt-3 flex gap-2">
                    <Skeleton className="h-7 w-24 rounded-lg" />
                    <Skeleton className="h-7 w-20 rounded-lg" />
                    <Skeleton className="ml-auto h-7 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
