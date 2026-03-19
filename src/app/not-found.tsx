"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageReveal } from "@/components/Reveal";

export default function NotFoundPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, router]);

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-8 sm:px-6">
      <PageReveal className="w-full max-w-lg" y={12} duration={0.35}>
        <section className="text-center">
          <div className="space-y-3">
            <Badge className="gap-1 bg-accent/10 text-accent hover:bg-accent/10">
              <Search className="h-3.5 w-3.5" />
              Not Found
            </Badge>
            <h1 className="text-5xl font-black tracking-tight">404</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              We could not find the page you were looking for.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {autoRedirect && countdown > 0 && (
              <div className="rounded-xl border border-border/60 bg-muted/25 p-3.5 text-sm text-muted-foreground">
                Taking you back home in <span className="font-semibold text-accent">{countdown}</span> second
                {countdown !== 1 ? "s" : ""}.
                <button
                  type="button"
                  onClick={() => setAutoRedirect(false)}
                  className="ml-2 font-medium underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  Stay here
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => router.push("/")}
                className="group h-auto w-full gap-2 rounded-xl px-6 py-3 text-sm font-semibold sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Back to home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="group h-auto w-full gap-2 rounded-xl border-border/70 bg-background px-6 py-3 text-sm hover:border-accent/40 hover:bg-accent/5 sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Previous page
              </Button>
            </div>
          </div>
        </section>
      </PageReveal>
    </main>
  );
}
