"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border/70 text-center">
          <CardHeader className="items-center">
            <Badge className="gap-1 bg-accent/10 text-accent hover:bg-accent/10">
              <Search className="h-3.5 w-3.5" />
              Not Found
            </Badge>
            <CardTitle className="text-5xl font-black tracking-tight">404</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              The page you requested does not exist.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {autoRedirect && countdown > 0 && (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
                Redirecting to home in <span className="font-semibold text-accent">{countdown}</span> second
                {countdown !== 1 ? "s" : ""}.
                <button
                  type="button"
                  onClick={() => setAutoRedirect(false)}
                  className="ml-2 underline underline-offset-2 hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button onClick={() => router.push("/")} className="w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Go home
              </Button>
              <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
